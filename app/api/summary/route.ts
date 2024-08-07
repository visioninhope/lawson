import { NextResponse } from "next/server";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";
import { getAuth } from "@clerk/nextjs/server";
import { Result } from "postcss";

const systemTemplateShort = process.env.SYSTEM_TEMPLATE_SHORT;
const systemTemplateLong = process.env.SYSTEM_TEMPLATE_LONG;

export async function POST(req: Request) {
  const user = getAuth(req as any);
  if (!user) {
    return NextResponse.json({
      error: "Please sign in",
    });
  }

  const data = await req.json();
  const fileUrl = data.fileUrl;
  const type = data.type;
  const sysPrompt = data.prompt;
  const isLarge = data.doc.isLarge
  if (isLarge){
    console.log('LARGE SUMMARY ROUTE CALLED')
    const res = await fetch(`${process.env.EMBEDDER_URL}/summarize/${data.doc.id}?api_key=${process.env.EM_API_KEY}`,{
      method : 'GET',
      headers : {
        "Content-Type": "application/json"
      }
    })
    console.log(res)
    if(res.ok){
      const data = await res.json()
      return NextResponse.json({
        result : data.message
      })
    }
    else{
      return NextResponse.json({
        result : "error getting summary"
      })
    }
  }
  let systemTemplate = null;
  console.log(type);
  console.log(sysPrompt);

  if (type == "small") systemTemplate = systemTemplateShort;
  else if (type == "large") systemTemplate = systemTemplateLong;
  else if (type == "custom") systemTemplate = sysPrompt;

  const pdfile: any = await fetch(fileUrl);

  const loder = new PDFLoader(pdfile, {
    splitPages: false,
    parsedItemSeparator: "",
  });

  const docs = await loder.load();
  const prompt = docs[0].pageContent;

  const model = new ChatTogetherAI({
    modelName: "mistralai/Mistral-7B-Instruct-v0.3",
    apiKey: process.env.TO_API_KEY,
    temperature: 0,
  });

  const parser = new StringOutputParser();
  const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", systemTemplate],
    ["user", "{text}"],
  ]);

  const chain = promptTemplate.pipe(model).pipe(parser);
  const res = await chain.invoke({ text: prompt });
  console.log(res);
  return NextResponse.json({
    result: res,
  });
}
