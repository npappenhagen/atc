"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { ClientResponseError } from "pocketbase"

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
    console.error("Invalid JSON input. Returning an empty object.")
    return {} // Return an empty object in case of error
  }
}

/**
 * Wrapper function specifically for handling the form submission of CreateResumeForm.
 * It creates a new resume with a selected or default template.
 */
export async function createResumeFromForm(formData: FormData) {
  const userId = formData.get("userId") as string
  const name = formData.get("name") as string
  const content = parseAndFormatJSON(formData.get("content") as string)
  const templateId = formData.get("templateId") as string

  try {
    // Reuse the createOrUpdateResume function to handle the creation logic.
    const newResume = await createOrUpdateResume({
      user_id: userId,
      name,
      content: JSON.stringify(content),
      template_id: templateId,
    })
    return newResume
  } catch (error) {
    handlePocketBaseError(error)
    throw new Error("Failed to create resume from form data. Please try again.")
  }
}

/**
 * Creates or updates a resume.
 * This function handles creating a new resume, cloning an existing resume, and managing versions.
 */
export async function createOrUpdateResume({
  user_id,
  name,
  content,
  template_id,
  resume_id_to_clone,
}: {
  user_id: string
  name: string
  content: string
  template_id?: string
  resume_id_to_clone?: string
}) {
  let resume, templateVersion, newResumeVersion

  try {
    if (resume_id_to_clone) {
      // Clone an existing resume
      const resumeToClone = await db
        .collection("resumes")
        .getOne(resume_id_to_clone)

      if (!resumeToClone) {
        throw new Error("Resume to clone not found.")
      }

      const resumeVersionToClone = await db
        .collection("resume_versions")
        .getOne(resumeToClone.current_version_id)

      if (!resumeVersionToClone) {
        throw new Error("Resume version to clone not found.")
      }

      const templateVersionToClone = await db
        .collection("template_versions")
        .getOne(resumeVersionToClone.template_version_id)

      if (!templateVersionToClone) {
        throw new Error("Template version to clone not found.")
      }

      // Create a new resume based on the clone
      resume = await db.collection("resumes").create({
        user_id,
        name: name || `${resumeToClone.name} (Copy)`,
        content:
          content || JSON.stringify(resumeVersionToClone.content, null, 2),
        current_version_id: null,
      })

      templateVersion = templateVersionToClone
    } else {
      // Creating a new resume
      if (!template_id) {
        template_id = await getDefaultTemplateId(user_id)
      }

      const template = await db.collection("templates").getOne(template_id)
      templateVersion = await db
        .collection("template_versions")
        .getOne(template.current_version_id)

      resume = await db.collection("resumes").create({
        user_id,
        name,
        content,
        current_version_id: null,
      })
    }

    // Create a new version of the resume, including the content
    newResumeVersion = await db.collection("resume_versions").create({
      resume_id: resume.id,
      version: 1,
      content: parseAndFormatJSON(content),
      template_version_id: templateVersion.id,
      user_id,
    })

    // Update resume with the initial version_id
    return await db.collection("resumes").update(resume.id, {
      current_version_id: newResumeVersion.id,
    })
  } catch (error) {
    console.error("Error in createOrUpdateResume:", error)
    handlePocketBaseError(error)
    throw new Error("Failed to create or update resume. Please try again.")
  }
}

/**
 * Fetches the content and template markup for a given resume.
 */
export async function fetchResumeData(resumeId: string) {
  try {
    const resume = await db.collection("resumes").getOne(resumeId)
    const resumeVersion = await db
      .collection("resume_versions")
      .getOne(resume.current_version_id)
    const templateVersion = await db
      .collection("template_versions")
      .getOne(resumeVersion.template_version_id)

    return {
      name: resume.name,
      content: resume.content,
      markup: templateVersion.markup,
    }
  } catch (error) {
    handlePocketBaseError(error)
    throw new Error("Failed to fetch resume data.")
  }
}

/**
 * Saves the content and template markup for a given resume, creating a new version if necessary.
 */
export async function saveResumeContent(
  resume_id: string,
  name: string,
  content: string,
  markup: string
) {
  const user = await getCurrentUser()

  try {
    const resume = await db.collection("resumes").getOne(resume_id)
    const resumeVersion = await db
      .collection("resume_versions")
      .getOne(resume.current_version_id)
    const currentTemplateVersion = await db
      .collection("template_versions")
      .getOne(resumeVersion.template_version_id)

    // Create a new version of the template if the markup has changed
    let newTemplateVersionId = currentTemplateVersion.id
    if (currentTemplateVersion.markup !== markup) {
      const newTemplateVersion = await db
        .collection("template_versions")
        .create({
          template_id: currentTemplateVersion.template_id,
          markup,
          version: currentTemplateVersion.version + 1,
          user_id: user.id,
        })
      newTemplateVersionId = newTemplateVersion.id
    }

    // Create a new version of the resume
    const newResumeVersion = await db.collection("resume_versions").create({
      resume_id: resume.id,
      version: resumeVersion.version + 1,
      content: parseAndFormatJSON(content),
      template_version_id: newTemplateVersionId,
      user_id: resume.user_id,
    })

    // Update the resume to point to the new version
    const updatedResume = await db.collection("resumes").update(resume.id, {
      name,
      content: parseAndFormatJSON(content),
      current_version_id: newResumeVersion.id,
    })

    return updatedResume
  } catch (error) {
    handlePocketBaseError(error)
    throw new Error("Failed to save resume content. Please try again.")
  }
}
