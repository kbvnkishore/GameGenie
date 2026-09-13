const mockAgentService = require("../server/services/mockAgentService");

describe("Mock game generation", () => {
  test("generated game URLs stay within the local app instead of external websites", async () => {
    const result = await mockAgentService.generateGame("A game about a robot in space", "kids-test");

    expect(result.success).toBe(true);
    expect(result.url).toBeTruthy();
    expect(result.url.startsWith("http://") || result.url.startsWith("https://")).toBe(false);
    expect(result.url.startsWith("/") || result.url.startsWith("file://")).toBe(true);
  });
});
