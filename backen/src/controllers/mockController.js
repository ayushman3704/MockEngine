const mongoose = require("mongoose");
const Endpoint = require("../models/Endpoint");
const Project = require("../models/Project");
const { faker } = require("@faker-js/faker");

exports.generateMockData = async (req, res) => {
  try {
    const { userId, projectId } = req.params;

    // 🚀 THE NEW BULLETPROOF EXTRACTOR
    // Because we used router.use(), Express automatically places the leftover URL here!
    // If you type .../my-project/users in Postman, req.path is perfectly "/users"
    const rawPath = req.path.replace(/\/$/, ""); 
    const formattedPath = rawPath === "" ? "/" : rawPath;

    // console.log("\n--- 🔍 DEBUGGING API REQUEST ---");
    // console.log("1. URL userId:", userId);
    // console.log("2. URL projectSlug:", projectSlug);
    // console.log("3. Extracted Path:", formattedPath);

    // 1️⃣ Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    // 2️⃣ Find project
    const project = await Project.findOne({
      _id: projectId, // Database id match karega URL wali id se
      userId: userId
    }).lean();

    if (!project) {
      // console.log("❌ FAILED: Project not found in database.");
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // console.log("4. Found Project ID in DB:", project._id.toString());
    
    // // Log the EXACT query Mongoose is about to run
    // console.log("5. Querying Endpoint collection with:", {
    //   projectId: project._id.toString(),
    //   userId: userId,
    //   path: formattedPath
    // });

    // 3️⃣ Find endpoint schema
    const endpoint = await Endpoint.findOne({
      projectId: project._id,
      userId: userId,
      path: formattedPath 
    }).lean();

    if (!endpoint) {
      // console.log("❌ FAILED: Endpoint schema query returned null.");
      return res.status(404).json({ success: false, message: "Endpoint schema not found" });
    }

    // console.log("✅ SUCCESS: Endpoint found! Generating data...\n");

    // 4️⃣ Feature Flag: Force Error
    if (endpoint.config.forceError) {
      return res.status(500).json({
        error: "Internal Server Error"
      });
    }

    // 5️⃣ Delay Simulation
    if (endpoint.config.delay && endpoint.config.delay > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, endpoint.config.delay)
      );
    }

    // 6️⃣ Data Generators Map (Cleaner than switch-case)
    const generators = {
      uuid: () => faker.string.uuid(),
      fullName: () => faker.person.fullName(),
      email: () => faker.internet.email(),
      number: () => faker.number.int(),
      date: () => faker.date.recent().toISOString(),
      word: () => faker.lorem.word()
    };

    // 7️⃣ Prevent Server Overload
    const MAX_ITEMS = 1000;
    const itemCount = Math.min(endpoint.config.itemCount || 10, MAX_ITEMS);

    const result = [];

    // 8️⃣ Generate Fake Data
    for (let i = 0; i < itemCount; i++) {
      const item = {};

      endpoint.fields.forEach((field) => {
        const generator = generators[field.dataType];

        item[field.fieldName] = generator
          ? generator()
          : faker.lorem.word();
      });

      result.push(item);
    }

    // 9️⃣ Send Response
    return res.status(200).json(result);

  } catch (error) {
    console.error("Mock generation error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};