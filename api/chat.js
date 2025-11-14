export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userMessage = (body && body.message) || "";
    if (!userMessage) {
      return new Response(JSON.stringify({ error: "Missing 'message' field" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server missing OPENAI_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                "你是 WeEurope.ai 的欧洲信息助手，面向中文用户，擅长解释欧洲多个国家的签证、居留、教育和商业信息。回答要清晰、诚实，不要给法律或税务的绝对保证，必要时提醒用户咨询专业人士。",
            },
            { role: "user", content: userMessage },
          ],
        }),
      });

      if (!apiRes.ok) {
        const txt = await apiRes.text();
        return new Response(
          JSON.stringify({
            error: "OpenAI API error",
            details: txt.slice(0, 300),
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const data = await apiRes.json();
      const reply =
        data.choices?.[0]?.message?.content ||
        "（没有从 OpenAI 收到内容，请稍后重试。）";

      return new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Request to OpenAI failed", details: String(err) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
