import mongoose from "mongoose";
import { DB_NAME } from "../constants";

const ConnectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("DB Connection Error: ", error);
    process.exit(1);
  }
};

export default ConnectDB;
