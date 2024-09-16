import "dotenv/config";
import ConnectDB from "./db";
import { app } from "./app";

ConnectDB()
  .then(() => {
    app.on("error", (error) => {
      console.error("Express Error: ", error);
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙ Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("DB Connection Error: ", error);
  });
