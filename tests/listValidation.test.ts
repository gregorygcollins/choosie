import { describe, expect, it } from "vitest";
import { createListSchema, shareListSchema, updateListSchema } from "../lib/validation";

describe("list API validation", () => {
  it("accepts create payloads with bounded items", () => {
    const parsed = createListSchema.parse({
      title: "Friday",
      moduleType: "music",
      items: [{ title: "Waterloo", image: "https://example.com/cover.jpg" }],
    });

    expect(parsed.title).toBe("Friday");
    expect(parsed.moduleType).toBe("music");
    expect(parsed.items?.[0].title).toBe("Waterloo");
  });

  it("rejects malformed create payloads", () => {
    expect(() => createListSchema.parse({ title: "", items: [] })).toThrow();
    expect(() => createListSchema.parse({ title: "x", moduleType: "games" })).toThrow();
    expect(() =>
      createListSchema.parse({
        title: "x",
        items: Array.from({ length: 101 }, (_, i) => ({ title: `Item ${i}` })),
      })
    ).toThrow();
  });

  it("accepts list updates for title, participants, and ordered items", () => {
    const parsed = updateListSchema.parse({
      listId: "list_123",
      title: "Dinner",
      participants: 4,
      items: [
        { id: "item_1", title: "Thai", notes: null, image: null },
        { title: "Pizza", notes: "nearby" },
      ],
    });

    expect(parsed.participants).toBe(4);
    expect(parsed.items?.length).toBe(2);
  });

  it("rejects unsafe list updates", () => {
    expect(() => updateListSchema.parse({ title: "Missing id" })).toThrow();
    expect(() => updateListSchema.parse({ listId: "list_123", participants: 0 })).toThrow();
    expect(() => updateListSchema.parse({ listId: "list_123", items: [{ title: "" }] })).toThrow();
  });

  it("validates share actions", () => {
    expect(shareListSchema.parse({ listId: "list_123" }).action).toBe("enable");
    expect(shareListSchema.parse({ listId: "list_123", action: "disable" }).action).toBe("disable");
    expect(() => shareListSchema.parse({ listId: "list_123", action: "public" })).toThrow();
  });
});
