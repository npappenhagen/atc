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

routerAdd('POST', '/api/otp/auth', async (c) => {
    const dao = $app.dao();
    const parsed = (() => {
        const rawBody = readerToString(c.request().body);
        try {
            return JSON.parse(rawBody);
        } catch (e) {
            throw new BadRequestError(`Error parsing payload. Invalid JSON: ${rawBody}`, e);
        }
    })();

    const email = parsed.email?.trim();
    if (!email) {
        throw new BadRequestError("Missing email");
    }

    const code = $security.randomStringWithAlphabet(6, '0123456789');
    console.log(`Generated OTP for ${email}: ${code}`);

    const handleOTPRecord = async () => {
        const collection = dao.findCollectionByNameOrId('otp');

        // Try to find an existing OTP record or handle as new record
        let otpRecord = null;
        try {
            otpRecord = dao.findFirstRecordByData('otp', 'email', email);
        } catch (e) {
            // No existing record found, create a new one
            otpRecord = new Record(collection, { email });
        }

        otpRecord.set('code', code);
        otpRecord.set('updated', Date.now());  // Update the timestamp whenever code is regenerated

        return dao.saveRecord(otpRecord);
    };

    try {
        // Handle OTP record creation or update
        await handleOTPRecord();
        console.log(`OTP record for ${email} saved/updated successfully.`);

        // Prepare and send the email with the OTP code
        const message = new MailerMessage({
            from: {
                address: $app.settings().meta.senderAddress,
                name: $app.settings().meta.senderName,
            },
            to: [{ address: email }],
            subject: `Your 6-digit login code`,
            text: `Your 6-digit login code is: ${code}\n\nPlease enter this code in the app to continue.\n\nIf you didn't request this code, please ignore this email.`,
        });

        // Send the OTP email
        $app.newMailClient().send(message);

        // Return a successful response
        return c.json(200, {
            status: 200,
            message: `Please check your email for your 6-digit code.`,
        });
    } catch (error) {
        console.error(`Error handling OTP for ${email}:`, error);
        throw new BadRequestError(`Error processing OTP: ${error.message}`);
    }
});
routerAdd('POST', '/api/otp/verify', (c) => {
    const dao = $app.dao();
    const parsed = (() => {
        const rawBody = readerToString(c.request().body);
        try {
            return JSON.parse(rawBody);
        } catch (e) {
            throw new BadRequestError(`Error parsing payload. Invalid JSON: ${rawBody}`, e);
        }
    })();

    const email = parsed.email?.trim();
    const code = parsed.code;
    const OTP_EXPIRATION_MS = 3600000; // 1 hour expiration

    console.log(`Verifying OTP for email: ${email}, code: ${code}`);

    try {
        const record = dao.findFirstRecordByData('otp', 'email', email);

        if (!record) {
            throw new BadRequestError('No OTP found for this email');
        }

        const storedCode = record.getInt('code')
        const enteredCode = Number(code);

        if (storedCode !== enteredCode) {
            console.error(`Invalid code entered. Stored code: ${storedCode}, Entered code: ${enteredCode}`);
            throw new BadRequestError(`Invalid OTP code ${JSON.stringify(parsed)}`);
        }

        // Use the `updated` timestamp instead of `created`
        const updatedTimestamp = record.updated.time().unix(); // Convert to seconds
        const nowTimestamp = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds

        // Calculate the difference in seconds and compare to expiration time in seconds
        const timeSinceUpdate = nowTimestamp - updatedTimestamp;
        const expirationTimeInSeconds = OTP_EXPIRATION_MS / 1000;

        if (timeSinceUpdate > expirationTimeInSeconds) {
            console.error(`OTP expired for email: ${email}. Expiration time: ${expirationTimeInSeconds} seconds`);
            throw new BadRequestError('OTP has expired. Please request a new one.');
        }

        console.log(`OTP verified successfully for email: ${email}`);

    } catch (e) {
        console.error(`Error verifying OTP for email: ${email}: ${e}`);
        throw e;
    }

    // Attempt to find or create the user record
    const userRecord = (() => {
        try {
            return dao.findFirstRecordByData('users', 'email', email);
        } catch (e) {
            console.error(`User not found for email: ${email}. Creating a new user.`);

            const usersCollection = dao.findCollectionByNameOrId('users');
            const user = new Record(usersCollection);

            try {
                const username = $app.dao().suggestUniqueAuthRecordUsername(
                    'users',
                    'user' + $security.randomStringWithAlphabet(5, '123456789')
                );

                user.set('username', username);
                user.set('email', email);
                user.set('subscription', 'free');
                user.setPassword($security.randomString(20)); // Fake password (not used)
                dao.saveRecord(user);

                console.log(`Created new user for email: ${email}, username: ${username}`);
                return user;

            } catch (e) {
                throw new BadRequestError(`Could not create user: ${e}`);
            }
        }
    })();

    return $apis.recordAuthResponse($app, c, userRecord);
});