import mongoose from "mongoose";
async function connectDB(url) {
  try {
    mongoose.connect(url);
    console.log("Connected to the database successfully");
  } catch (error) {
    console.error(error);
  }
}
export { connectDB };
