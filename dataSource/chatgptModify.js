const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  organization: process.env.ORG_KEY,

  apiKey: process.env.CHATAPT_KEY,
});

const openai = new OpenAIApi(configuration);

const prompt_origin =
  "下記文書をニュースキャスターみたいに日本語文書に書き直して、文書以外返事しないで：";

async function generateScript(paraph) {
  try {
    console.log("requesting OpenAI API");
    if (!configuration.apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    if (paraph.trim().length === 0) {
      throw new Error("Please enter a valid paraph");
    }

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt_origin + paraph }],
    });
    console.log(completion.data.choices[0].message);
    return completion.data.choices[0].message.content;
  } catch (error) {
    if (error.response) {
      console.error(error.response.status, error.response.data);
    //   res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
    //   res.status(500).json({
    //     error: {
    //       message: "An error occurred during your request.",
    //     },
    //   });
    }
  }
}

module.exports.generateScript = generateScript;
