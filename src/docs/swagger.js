
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "India Location API",
      version: "1.0.0",
      description:
        "An API to access Indian states, districts, sub-districts, and villages.",
    },
    servers: [
      {
        url: "https://location-api-az0d.onrender.com",
        description: "Production server",
      },
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/app.js"],
};

module.exports = swaggerJsdoc(options);

