process.on('unhandledRejection', (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on('uncaughtException', (error) => {
  console.error("Uncaught Exception:", error);
});
import dotenv from "dotenv";
dotenv.config();
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";

async function indexDocument() {
  try {
    const PDF_Path = "./dsa.pdf";
    const pdfLoader = new PDFLoader(PDF_Path);
    const rawDocs = await pdfLoader.load();
    console.log("------------PDF LOADED------------");

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunkedDocs = await textSplitter.splitDocuments(rawDocs);
    console.log(`------------CHUNKING COMPLETED: ${chunkedDocs.length} chunks generated------------`);

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-embedding-001",
    });
    console.log("------------EMBEDDING MODEL CONFIGURED------------");

    const pinecone = new PineconeClient();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);
    console.log("------------PINECONE CONFIGURED------------");

    console.log("------------TESTING 1 DOCUMENT EMBEDDING...------------");
    const testResult = await embeddings.embedQuery("Test document to check if embedding API is working");
    console.log("------------TEST EMBEDDING SUCCESSFUL! Dimension: " + testResult.length + "------------");

    console.log("------------GENERATING EMBEDDINGS SEQUENTIALLY TO AVOID RATE LIMITS...------------");
    const allTexts = chunkedDocs.map(d => d.pageContent);
    const bulkResult = [];
    for (let i = 0; i < allTexts.length; i += 10) {
      if (i > 0 && i % 90 === 0) {
        console.log("Free API Rate limit reached (100 per min). Pausing for 60 seconds...");
        await new Promise(r => setTimeout(r, 60000));
      }
      
      const batch = allTexts.slice(i, i + 10);
      try {
        const reqs = batch.map(text => ({ content: { role: "user", parts: [{ text: text.replace(/\n/g, " ") }] } }));
        const genAI = embeddings.client; // use the base client
        const res = await genAI.batchEmbedContents({ requests: reqs });
        bulkResult.push(...res.embeddings.map(e => e.values));
        console.log(`Embedded ${bulkResult.length} / ${allTexts.length}`);
      } catch (err) {
        console.log("BATCH ERROR:", err.message);
        throw err;
      }
    }

    console.log("------------CREATING VECTOR OBJECTS FOR PINECONE...------------");
    const vectors = allTexts.map((text, idx) => ({
      id: `doc-${idx}`,
      values: bulkResult[idx],
      metadata: { 
        text, 
        source: chunkedDocs[idx].metadata?.source || "unknown",
        loc: JSON.stringify(chunkedDocs[idx].metadata?.loc || {})
      },
    }));

    console.log("------------UPSERTING INTO PINECONE IN BATCHES...------------");
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await pineconeIndex.upsert(batch);
      console.log(`Upserted batch ${i / batchSize + 1} (${batch.length} vectors)`);
    }

    console.log("------------DATA STORED SUCCESSFULLY------------");
  } catch (error) {
    console.error("❌ Error during indexing:", error.message);
    console.error(error);
  }
}

indexDocument();