// app/actions.ts
"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

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
    emailVisibility: true,
    password,
    passwordConfirm: password,
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

// resume things //

/**
 * Formats and parses a string into JSON. If the string is not valid JSON, returns an empty object.
 */
function parseAndFormatJSON(content: string): object {
  try {
    const parsed = JSON.parse(content)
    return parsed // Returns the parsed JSON object
  } catch (error) {
    console.error("Invalid JSON input. Returning an empty object.")
    return {} // Return an empty object in case of error
  }
}

/**
 * Creates a new resume with a selected or default template and initial version.
 */
export async function createResume(formData: FormData) {
  const userId = formData.get("userId") as string
  const name = formData.get("name") as string
  const rawContent = formData.get("content") as string
  const content = parseAndFormatJSON(rawContent) // Parsed JSON object
  const templateId =
    (formData.get("templateId") as string) ||
    (await getDefaultTemplateId(userId))

  try {
    // Create resume
    const resumeResponse = await db.collection("resumes").create({
      user_id: userId,
      name: name,
      content: content, // The parsed JSON object
      current_version_id: null,
    })

    const resume = resumeResponse

    // Fetch the initial template markup
    const template = await db.collection("templates").getOne(templateId)
    const templateVersion = await db
      .collection("template_versions")
      .getOne(template.current_version_id)

    // Create initial resume version
    const versionResponse = await db.collection("resume_versions").create({
      resume_id: resume.id,
      version: 1,
      content: content, // The parsed JSON object
      template_version_id: templateVersion.id,
      user_id: userId,
      created_at: new Date().toISOString(),
    })

    const version = versionResponse

    // Update resume with the initial version_id
    await db.collection("resumes").update(resume.id, {
      current_version_id: version.id,
    })

    return resume
  } catch (error) {
    console.error("Error creating resume:", error)
    throw new Error(
      "Failed to create resume. Please check the inputs and try again."
    )
  }
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

/**
 * Fetches the content and template markup for a given resume.
 */
export async function fetchResumeContent(resumeId: string) {
  console.warn("fetchResumeContent.0")
  console.warn("resumeId", resumeId)
  const resume = await db.collection("resumes").getOne(resumeId)
  console.warn("fetchResumeContent.resume", resume)
  const resumeVersion = await db
    .collection("resume_versions")
    .getOne(resume.current_version_id)

  console.warn("fetchResumeContent.resumeVersion", resumeVersion)
  console.warn("fetchResumeContent.1")
  console.warn(resume)
  console.warn("resumeVersion", resumeVersion)
  const templateVersion = await db
    .collection("template_versions")
    .getOne(resumeVersion.template_version_id)
  console.warn("fetchResumeContent.2")
  console.warn("templateVersion", templateVersion)
  console.warn("templateVersion.markup", templateVersion.markup)
  return {
    name: resume.name,
    content: resume.content,
    markup: templateVersion.markup,
  }
}

/**
 * Saves the content and template markup for a given resume, creating a new version if necessary.
 */
export async function saveResumeContent(
  resumeId: string,
  content: string,
  markup: string
) {
  const user = await getCurrentUser()

  console.warn("saveResumeContent.0")
  const resume = await db.collection("resumes").getOne(resumeId)
  const template = await db.collection("templates").getOne(resume.template_id)

  console.warn("saveResumeContent.1")
  // Create a new version of the template if the markup has changed
  const latestTemplateVersion = await db
    .collection("template_versions")
    .getList(1, 1, {
      filter: `template_id = "${template.id}"`,
      sort: "-version",
    })
  console.warn("saveResumeContent.2")

  let newTemplateVersionId = latestTemplateVersion.items[0].id
  if (latestTemplateVersion.items[0].markup !== markup) {
    console.warn("saveResumeContent.3")
    const newTemplateVersion = await db.collection("template_versions").create({
      template_id: template.id,
      version: latestTemplateVersion.items[0].version + 1,
      markup: markup,
      user_id: user.id,
    })
    console.warn("saveResumeContent.4")
    newTemplateVersionId = newTemplateVersion.id

    // // point the `resume_version.template_version_id` to the one we just made`.
    // await db.collection("resume_version").update(template.id, {
    //   current_version_id: newTemplateVersionId,
    // })
    console.warn("saveResumeContent.5")
  }

  console.warn("saveResumeContent.6")
  // Create a new version of the resume
  const latestResumeVersion = await db
    .collection("resume_versions")
    .getList(1, 1, {
      filter: `resume_id = "${resumeId}"`,
      sort: "-version",
    })
  console.warn("saveResumeContent.7")

  const newResumeVersion = await db.collection("resume_versions").create({
    resume_id: resumeId,
    version: latestResumeVersion.items[0].version + 1,
    content: JSON.parse(content),
    template_version_id: newTemplateVersionId,
    user_id: resume.user_id,
    created_at: new Date().toISOString(),
  })
  console.warn("saveResumeContent.8")

  // Update the resume to point to the new version
  await db.collection("resumes").update(resumeId, {
    current_version_id: newResumeVersion.id,
    content: JSON.parse(content),
  })
  console.warn("saveResumeContent.9")
  console.warn("saveResumeContent.newResumeVersion", newResumeVersion)

  return newResumeVersion
}

/**
 * Fetches or creates the default template ID for a given user.
 */
async function getDefaultTemplateId(userId: string) {
  console.log(`Fetching default template for user: ${userId}`)

  try {
    // Attempt to fetch the default template
    const defaultTemplate = await db
      .collection("templates")
      .getFirstListItem(`published = true && user_id = "${userId}"`)

    if (defaultTemplate) {
      console.log(`Default template found: ${JSON.stringify(defaultTemplate)}`)
      return defaultTemplate.id
    }
  } catch (error) {
    if (error.status !== 404) {
      console.error("Error in getDefaultTemplateId:", error)
      throw new Error(
        `Failed to fetch default template. error: ${error.message}`
      )
    }
  }

  // If no default template found, create a new one
  try {
    const newTemplate = await db.collection("templates").create({
      name: "Default Template",
      published: true,
      shared: false,
      user_id: userId, // Ensure this is a valid user ID
      current_version_id: null, // Initially set to null
    })

    console.log(`New template created: ${JSON.stringify(newTemplate)}`)

    // Create initial template version
    const initialTemplateVersion = await db
      .collection("template_versions")
      .create({
        template_id: newTemplate.id,
        version: 1,
        markup: "<div>{{content}}</div>",
        created_at: new Date().toISOString(),
      })

    console.log(
      `Initial template version created: ${JSON.stringify(initialTemplateVersion)}`
    )

    // Update template to point to the initial version
    await db.collection("templates").update(newTemplate.id, {
      current_version_id: initialTemplateVersion.id,
    })

    console.log(`Template updated with initial version: ${newTemplate.id}`)

    return newTemplate.id
  } catch (error) {
    console.error("Error in creating default template:", error)
    throw new Error(
      `Failed to create default template. error: ${error.message}`
    )
  }
}

export async function fetchResumes(userId: string) {
  const resumes = await db.collection("resumes").getList(1, 50, {
    filter: `user_id = "${userId}"`,
  })
  return resumes.items
}

/**
 * Updates the resume with the given ID.
 */
export async function updateResume(
  resumeId: string,
  name: string,
  content: string,
  markup: string
) {
  const user = await getCurrentUser()

  try {
    console.warn("updateResume.1")
    const parsedContent = JSON.parse(content)
    const updatePayload = {
      user_id: user.id,
    }
    if (name) {
      updatePayload.name = name
    }
    if (content) {
      updatePayload.content = parsedContent
    }

    console.warn("updateResume.updatePayload", JSON.stringify(updatePayload))
    const resume = await db
      .collection("resumes")
      .update(resumeId, updatePayload)
    console.warn("updateResume.2")

    const currentResumeVersion = await db
      .collection("resume_versions")
      .getOne(resume.current_version_id)

    let newTemplateVersion = null
    if (markup) {
      console.warn("updateResume.3")
      console.warn("updateResume.3.resume", resume)
      // // Update the associated template with the new markup
      const resumeVersion = await db
        .collection("resume_versions")
        .getOne(resume.current_version_id)
      //
      // console.warn("updateResume.3.1")
      // console.warn(resume)
      // console.warn("resumeVersion", resumeVersion)
      // const templateVersion = await db
      //     .collection("template_versions")
      //     .getOne(resumeVersion.template_version_id)
      //

      // const template = await db
      //   .collection("templates")
      //   .getOne(resumeVersion.template_version_id)
      console.warn("updateResume.4")
      const lastTemplateVersion = await db
        .collection("template_versions")
        .getOne(resumeVersion.template_version_id)
      console.warn("updateResume.4.lastTemplateVersion", lastTemplateVersion)
      newTemplateVersion = await db.collection("template_versions").create({
        template_id: lastTemplateVersion.template_id,
        markup,
        version: lastTemplateVersion.version + 1,
        user_id: user.id,
      })
      console.warn("updateResume.4.newTemplateVersion", newTemplateVersion)
      console.warn("updateResume.5")
    }
    const newResumeVersion = await db.collection("resume_versions").create({
      resume_id: resume.id,
      version: currentResumeVersion.version + 1,
      content: JSON.parse(content),
      template_version_id: newTemplateVersion?.id,
      user_id: resume.user_id,
    })
    console.warn("updateResume.just updated resume-version", newResumeVersion)

    const updatedResume = await db.collection("resumes").update(resume.id, {
      resume_id: resume.id,
      current_version_id: newResumeVersion.id,
    })

    console.warn("updateResume.just updated resume", updatedResume)

    return updatedResume
  } catch (error) {
    console.warn("updateResume.6")
    handlePocketBaseError(error)
    throw new Error("Failed to update resume. Please try again.")
  }
}

export async function deleteResume(resumeId: string) {
  await db.collection("resumes").delete(resumeId)
}

import PocketBase, { ClientResponseError } from "pocketbase"

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
