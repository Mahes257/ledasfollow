import swaggerJSDoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.3",

        info: {
            title: "Enterprise CRM API",
            version: "1.0.0",
            description: "Enterprise CRM Backend API Documentation"
        },

        servers: [
            {
                url: "http://localhost:5100",
                description: "Local Development Server"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description:
                        "Enter JWT token only. Do not type 'Bearer'."
                }
            }
        },

        security: [
            {
                bearerAuth: []
            }
        ],

        tags: [
            { name: "Health", description: "Health Check APIs" },
            { name: "Authentication", description: "Authentication & Authorization APIs" },
            { name: "Leads", description: "Lead Management APIs" },
            { name: "Follow-ups", description: "Lead Follow-up APIs" },
            { name: "Activities", description: "Lead Activity APIs" },
            { name: "Attachments", description: "Lead Attachment APIs" },
            { name: "Followups", description: "Follow-up Management APIs" },
            { name: "Contacts", description: "Contact Management APIs" },
            { name: "Customers", description: "Customer Management APIs" }
        ]
    },

    apis: [
        "./src/modules/**/*.js",
        "./src/app.js"
    ]
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;