import ContactSetting from "../models/ContactSetting.js";

const seedContactSettings = async () => {
  try {
    const count = await ContactSetting.countDocuments();

    if (count === 0) {
      console.log("🌱 Seeding contact settings...");

      const defaultSettings = [
        // Contact page settings
        { key: "hero_badge", value: "Get In Touch" },
        { key: "hero_heading", value: "Let's Talk About AI" },
        { key: "hero_description", value: "Have a question about a tool, want to submit a product, or just want to say hello? We're here for you." },
        { key: "faq_button_text", value: "Check FAQ First" },
        { key: "contact_email", value: "hello@toolsphere.ai" },
        { key: "office_location", value: "San Francisco, CA" },
        { key: "response_time", value: "Mon-Fri, 9AM-6PM PST" },
        { key: "working_days", value: "Monday - Friday" },
        { key: "working_hours", value: "9:00 AM - 6:00 PM" },
        // Footer settings
        { key: "footer_copyright", value: "ToolSphere" },
        { key: "footer_description", value: "Discover & explore the best AI tools in one place. Curated directory of top AI platforms for every workflow." },
        { key: "footer_email", value: "hello@toolsphere.ai" },
        { key: "footer_disclaimer", value: "All tools are provided by their respective owners. We are not affiliated with any tool unless explicitly stated." },
      ];

      await ContactSetting.insertMany(defaultSettings);
      console.log(`✅ Seeded ${defaultSettings.length} contact settings`);
    } else {
      console.log("ℹ️ Contact settings already exist, skipping seed");
    }
  } catch (err) {
    console.error("⚠️ Contact settings seed failed (non-blocking):", err.message);
  }
};

export default seedContactSettings;