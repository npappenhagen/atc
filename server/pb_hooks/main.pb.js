onModelAfterCreate( (event) => {
    const { model, dao } = event;

    if (model.tableName() === 'resume_versions') {
        const resumeId = model.get('resume_id');

        // Ensure the resume_id exists
        if (!resumeId) {
            $app.logger().error("Missing resume_id in resume_version record", model.id);
            return;
        }

        try {
            $app.dao().runInTransaction((txDao) => {
                $app.logger().info(`runInTransaction.1`);
                const record = txDao.findRecordById("resumes", resumeId)
                record.set("current_version", model.id)
                txDao.saveRecord(record)
            })
            $app.logger().info(`Successfully updated resume ${resumeId}.current_version with new version ${model.id}`);
        } catch (error) {
            $app.logger().error("Failed to update resume:", "error", JSON.stringify(error,null, 2));
        }
    }
}, "resume_versions");



onModelAfterCreate((event) => {
    const { model, dao } = event;

    // Ensure this is a template_version record
    if (model.tableName() === 'template_versions') {
        const templateId = model.get('template_id');

        // Ensure the template_id exists
        if (!templateId) {
            $app.logger().error("Missing template_id in template_version record", model.id);
            return;
        }

        // Update the associated template's current_version field within a transaction
        try {
            dao.runInTransaction((txDao) => {
                const record = txDao.findRecordById("templates", templateId);
                record.set("current_version", model.id);
                txDao.saveRecord(record);
            });
            $app.logger().info(`Successfully updated template ${templateId}.current_version with new version ${model.id}`);
        } catch (error) {
            $app.logger().error("Failed to update template:", JSON.stringify(error, null, 2));
        }
    }
}, "template_versions");