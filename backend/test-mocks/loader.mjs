// ESM loader that redirects the Newsletter and User model imports to in-memory
// mocks so the subscribe controller can be tested without a database.

const redirects = {
  "server/models/Newsletter.js": "newsletterMock.js",
  "server/models/User.js": "userMock.js",
  "server/models/Admin.js": "adminMock.js",
};

export async function resolve(specifier, context, next) {
  const result = await next(specifier, context);
  for (const [key, file] of Object.entries(redirects)) {
    if (result.url.endsWith(key)) {
      return {
        url: new URL(file, import.meta.url).href,
        shortCircuit: true,
      };
    }
  }
  return result;
}