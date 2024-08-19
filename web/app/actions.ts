"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { ClientResponseError } from "pocketbase"

/**
 * Helper function to handle PocketBase errors.
 */
function handlePocketBaseError(error: any) {
  if (error instanceof ClientResponseError) {
    switch (error.status) {
      case 400:
        console.error("Bad Request:", error.message)
        break
      case 401:
        console.error("Unauthorized:", error.message)
        break
      case 403:
        console.error("Forbidden:", error.message)
        break
      case 404:
        console.error("Not Found:", error.message)
        break
      case 500:
        console.error("Internal Server Error:", error.message)
        break
      default:
        console.error("PocketBase Error:", error.message)
    }
  } else {
    console.error("Unexpected Error:", error)
  }
}

/**
 * Formats and parses a string into JSON. If the string is not valid JSON, returns an empty object.
 */
function parseAndFormatJSON(content: string): object {
  try {
    const parsed = JSON.parse(content)
    return parsed // Returns the parsed JSON object
  } catch (error) {
    console.error("Invalid JSON input.", JSON.stringify(content, null, 2))
    return {}
  }
}

/**
 * Logs in the user by authenticating with PocketBase and
 * setting the authentication token in cookies.
 */
export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { token, record: model } = await db
    .collection("users")
    .authWithPassword(email, password)
  const cookie = JSON.stringify({ token, model })

  cookies().set("pb_auth", cookie, {
    secure: true,
    path: "/",
    sameSite: "strict",
    httpOnly: true,
  })

  db.authStore.save(token)

  redirect("/dashboard")
}

/**
 * Registers a new user in PocketBase, sets the authentication token in cookies,
 * and redirects to the dashboard.
 */
export async function register(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const username = formData.get("username") as string

  const data = {
    username,
    email,
    email_visibility: true,
    password,
    password_confirm: password,
    name: email,
  }

  try {
    await db.collection("users").create(data)

    const { token, record: model } = await db
      .collection("users")
      .authWithPassword(email, password)
    const cookie = JSON.stringify({ token, model })

    cookies().set("pb_auth", cookie, {
      secure: true,
      path: "/",
      sameSite: "strict",
      httpOnly: true,
    })

    db.authStore.save(token)

    redirect("/dashboard")
  } catch (error) {
    console.error("Error registering user:", error)
  }
}

/**
 * Logs out the user by clearing the authentication token from cookies and PocketBase,
 * and redirects to the login page.
 */
export async function logout() {
  cookies().delete("pb_auth")
  db.authStore.clear()
  redirect("/login")
}

export async function deleteResume(resumeId: string) {
  await db.collection("resumes").delete(resumeId)
}

/**
 * Fetches all published templates and those shared by other users.
 */
export async function fetchTemplates() {
  const templates = await db.collection("templates").getList(1, 50, {
    filter: "published = true || shared = true",
  })
  return templates.items
}

export async function fetchResumes(userId: string) {
  const resumes = await db.collection("resumes").getList(1, 50, {
    filter: `user_id = "${userId}"`,
  })
  return resumes.items
}

/**
 * Fetches or creates the default template ID for a given user.
 */
async function getDefaultTemplateId(userId: string) {
  try {
    const defaultTemplate = await db
      .collection("templates")
      .getFirstListItem(`published = true && user_id = "${userId}"`)

    if (defaultTemplate) {
      return defaultTemplate.id
    }
  } catch (error) {
    if (error.status !== 404) {
      throw new Error(
        `Failed to fetch default template. error: ${error.message}`
      )
    }
  }

  // If no default template found, create a new one
  const newTemplate = await db.collection("templates").create({
    name: "Default Template",
    published: true,
    shared: false,
    user_id: userId,
  })

  await db.collection("template_versions").create({
    template_id: newTemplate.id,
    version: 1,
    markup: "<div>{{content}}</div>",
    user_id: userId,
  })

  return newTemplate.id
}

/**
 * Clones an existing resume along with its associated template and versions.
 */
export async function cloneResume(
  resume_id_to_clone: string,
  user_id: string,
  name: string
) {
  // Fetch the resume to be cloned
  const resumeToClone = await db
    .collection("resumes")
    .getOne(resume_id_to_clone)
  if (!resumeToClone) throw new Error("Resume to clone not found.")

  // Fetch the latest version of the resume to be cloned
  const resumeVersionToClone = await db
    .collection("resume_versions")
    .getList(1, 1, {
      filter: `resume_id = "${resumeToClone.id}"`,
      sort: "-version",
    })
  if (!resumeVersionToClone.items.length)
    throw new Error("Resume version to clone not found.")

  // Fetch the template version associated with the resume version
  const templateVersionToClone = await db
    .collection("template_versions")
    .getOne(resumeVersionToClone.items[0].template_version_id)
  if (!templateVersionToClone)
    throw new Error("Template version to clone not found.")

  const originalTemplate = await db
    .collection("templates")
    .getOne(templateVersionToClone.template_id)

  // Clone the template
  const newTemplate = await db.collection("templates").create({
    user_id,
    name: `${originalTemplate.name} (Copy)`,
    // Other necessary fields can be copied from the original template
  })

  // Create a new template version based on the cloned template
  const newTemplateVersion = await db.collection("template_versions").create({
    template_id: newTemplate.id,
    version: 1, // Start new template version from 1
    markup: templateVersionToClone.markup, // Use the markup from the original template version
    user_id,
  })

  // Create a new resume based on the clone
  const newResume = await db.collection("resumes").create({
    user_id,
    name: name || `${resumeToClone.name} (Copy)`,
  })

  // Create a new version of the resume with cloned content and link to the new template version
  const newResumeVersion = await db.collection("resume_versions").create({
    resume_id: newResume.id,
    version: 1, // new resume & version mean we go back to version 1
    content: resumeVersionToClone.items[0].content, // Use the content from the latest version
    template_version_id: newTemplateVersion.id, // Link to the new template version
    user_id,
  })

  return newResumeVersion
}

/**
 * Saves a new version of the resume's content and template.
 */
export async function saveResumeVersion(
  resume_id: string,
  name: string,
  content: string,
  markup: string
) {
  console.warn("saveResumeVersion.1")
  const user = await getCurrentUser()

  try {
    // Get the latest resume version for the given resume_id
    const currentResumeVersion = await db
      .collection("resume_versions")
      .getFirstListItem(`resume_id = "${resume_id}"`, {
        sort: "-version",
      })
    console.warn("saveResumeVersion.2")

    if (!currentResumeVersion) {
      throw new Error("No existing resume version found.")
    }

    // Get the template_version_id from the current resume version
    const currentTemplateVersion = await db
      .collection("template_versions")
      .getOne(currentResumeVersion.template_version_id)
    if (!currentTemplateVersion) {
      throw new Error("No existing template version found.")
    }

    // Get the latest template version based on the template_id from the current template version
    const latestTemplateVersion = await db
      .collection("template_versions")
      .getFirstListItem(
        `template_id = "${currentTemplateVersion.template_id}"`,
        {
          sort: "-version",
        }
      )

    if (!latestTemplateVersion) {
      throw new Error("No template versions found.")
    }

    // Check if the markup has changed
    let newTemplateVersionId = latestTemplateVersion.id
    if (latestTemplateVersion.markup !== markup) {
      console.warn("saveResumeVersion.4")
      const newTemplateVersion = await db
        .collection("template_versions")
        .create({
          template_id: latestTemplateVersion.template_id,
          markup,
          version: latestTemplateVersion.version + 1,
          user_id: user.id,
        })
      console.warn("saveResumeVersion.5")
      newTemplateVersionId = newTemplateVersion.id
    }

    // Check if the content has changed
    // content is already JSON.stringify(content,null, 2) - but the currentResumeVersion is an actual JS object.
    const isContentUnchanged =
      content === JSON.stringify(currentResumeVersion.content, null, 2)
    const isTemplateUnchanged = latestTemplateVersion.markup === markup

    if (isContentUnchanged && isTemplateUnchanged) {
      console.warn("No changes to content or template markup, exiting save.")
      throw new Error("No changes detected. No new version was created.")
    }

    // Save the new resume version
    console.warn("saveResumeVersion.6")
    const newResumeVersion = await db.collection("resume_versions").create({
      resume_id: resume_id,
      version: currentResumeVersion.version + 1,
      content: parseAndFormatJSON(content),
      template_version_id: newTemplateVersionId,
      user_id: user.id,
    })
    console.warn("saveResumeVersion.7")

    return newResumeVersion
  } catch (error) {
    console.warn("saveResumeVersion.8")
    if (error.message === "No changes detected. No new version was created.") {
      throw new Error("No changes detected. No new version was created.")
    }
    handlePocketBaseError(error)
    throw new Error("Failed to save version.")
  }
}

/**

 •	Fetches the content, template markup, and name for a given resume.
 */
export async function fetchResumeData(resumeId: string) {
  try {
    const originalResume = await db.collection("resumes").getOne(resumeId)

    const resumeVersionList = await db
      .collection("resume_versions")
      .getList(1, 1, {
        filter: `resume_id = "${resumeId}"`,
        sort: "-version",
      })

    const resumeVersion = resumeVersionList.items[0]
    const templateVersion = await db
      .collection("template_versions")
      .getOne(resumeVersion.template_version_id)
    return {
      name: originalResume.name,
      content: resumeVersion.content,
      markup: templateVersion.markup,
    }
  } catch (error) {
    handlePocketBaseError(error)
    throw new Error("Failed to fetch resume data.")
  }
}

// Function to fetch public templates without requiring authentication
export async function fetchPublicTemplates() {
  try {
    const publicTemplates = await db.collection("templates").getFullList({
      filter: "published = true",
    })
    return publicTemplates
  } catch (error) {
    console.error("Failed to fetch public templates:", error.message)
    throw error
  }
}

// export async function fetchPublicTemplatesWithVersion() {
//   try {
//     console.warn("fetchPublicTemplatesWithVersion.1")
//     // Fetch public templates with autoCancel disabled
//     const publicTemplates = await db.collection("templates").getFullList({
//       filter: "published = true",
//       autoCancel: false, // Disable auto-cancellation
//     })
//
//     console.warn(
//       "fetchPublicTemplatesWithVersion.2",
//       JSON.stringify(publicTemplates, null, 2)
//     )
//
//     // For each template, fetch the latest associated template-version
//     const publicTemplatesWithVersions = await Promise.all(
//       publicTemplates.map(async (template) => {
//         console.warn(
//           "fetchPublicTemplatesWithVersion.3.template",
//           JSON.stringify(template, null, 2)
//         )
//         const templateVersionList = await db
//           .collection("template_versions")
//           .getList(1, 1, {
//             filter: `template_id = "${template.id}"`,
//             sort: "-version",
//             autoCancel: false, // Disable auto-cancellation
//           })
//         console.warn(
//           "fetchPublicTemplatesWithVersion.4.templateVersionList",
//           JSON.stringify(templateVersionList, null, 2)
//         )
//
//         const latestTemplateVersion = templateVersionList.items[0]
//
//         console.warn(
//           "fetchPublicTemplatesWithVersion.5.templateVersionList",
//           JSON.stringify(latestTemplateVersion, null, 2)
//         )
//
//         return {
//           id: template.id,
//           name: template.name,
//           templateVersion: latestTemplateVersion,
//         }
//       })
//     )
//
//     return publicTemplatesWithVersions
//   } catch (error) {
//     console.error("Failed to fetch public templates with versions:", error)
//     throw new Error("Failed to fetch public templates.")
//   }
// }

export async function fetchPublicTemplatesWithVersion() {
  try {
    console.warn("fetchPublicTemplatesWithVersion.1.template")

    // Fetch the latest template versions where the related template's `published` field is true
    const publicTemplateVersions = await db
      .collection("template_versions")
      .getList(1, 20, {
        rawParams: {
          max_field: "version",
        },
        filter: "template_id.published = true", // Ensure template is published && only select the max version
        sort: "-version", // Sort by version to get the latest one
        expand: "template_id", // Include related template data
      })

    console.warn(
      "fetchPublicTemplatesWithVersion.2.publicTemplateVersions",
      JSON.stringify(publicTemplateVersions.items, null, 2)
    )

    // Mapping the results to extract relevant fields
    const publicTemplatesWithVersions = publicTemplateVersions.items.map(
      (templateVersion) => {
        const template = templateVersion.expand?.template_id // Access expanded template data

        if (!template) {
          throw new Error(
            `No template found for template version: ${templateVersion.id}`
          )
        }

        return {
          id: template.id,
          name: template.name,
          templateVersion: templateVersion,
        }
      }
    )

    return publicTemplatesWithVersions
  } catch (error) {
    console.error("Failed to fetch public templates with versions:", error)
    throw new Error("Failed to fetch public templates.")
  }
}
