const dataController = require("../controllers/dataController");

module.exports = function (app) {
  // threads
//   app.get("/api/threads/:board", dataController.getThreads);
  app.post("/api/threads/:board", dataController.addBoard);
//   app.put("/api/threads/:board", dataController.reportThread);
//   app.delete("/api/threads/:board", dataController.deleteThread);
//   // replies
//   app.get("/api/replies/:board", dataController.getFullThread);
//   app.post("/api/replies/:board", dataController.newReply);
//   app.put("/api/replies/:board", dataController.reportReply);
//   app.delete("/api/replies/:board", dataController.deleteReply);
};
