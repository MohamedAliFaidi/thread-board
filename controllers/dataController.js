const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
mongoose.pluralize(null);
const Model = mongoose.model;

const BoardSchema = require("../schemas/BoardSchema");

const saltRounds = 10;
const objectID = (_id) => mongoose.Types.ObjectId(_id);

  // new board or thread
  async  function addBoard(req, res) {
    const { board } = req.params;
    const { text, delete_password } = req.body;
    const Board = Model(board, BoardSchema);
    // see if board already exists
   const b =  await  Board.findOne({})
      if (!b) {
        // hash PW
        bcrypt.hash(delete_password, saltRounds, async(err, hash) => {
          if (err) return console.error(err);
          const newBoard = new Board({
            text: text,
            delete_password: hash
          });
          // save new board to DB
         const nb = await Board.create(newBoard)
            return res.redirect(`/b/${board}/`);
          });
        
      } else {
        // hash PW
        bcrypt.hash(delete_password, saltRounds, (err, hash) => {
          if (err) return console.error(err);
          const newBoard = new Board({
            text: text,
            delete_password: hash
          });
          // add thread to board that alreay exists
          Board.create(newBoard, (err, docs) => {
            if (err) return console.error(err);
            return res.redirect(`/b/${board}/`);
          });
        });
      }
    
  }

  // report thread
 function reportThread(req, res) {
    const { board } = req.params;
    const { thread_id } = req.body;
    // invalid _id
    if (!mongoose.Types.ObjectId.isValid(thread_id))
      return res.send("Invalid _id");
    const Board = Model(board, BoardSchema);
    // find by _id and change reported value
    Board.findByIdAndUpdate(
      objectID(thread_id),
      { reported: !false },
      { useFindAndModify: false },
      (err, docs) => {
        if (err) return console.error(err);
        // if no _id in DB
        if (!docs) return console.log("No _id found");
        return res.send("success");
      }
    );
  }

  // delete thread
 function deleteThread(req, res) {
    const { board } = req.params;
    const { thread_id, delete_password } = req.body;
    // invalid _id
    if (!mongoose.Types.ObjectId.isValid(thread_id))
      return res.send("Invalid _id");
    const Board = Model(board, BoardSchema);
    // find thread
    Board.findById(objectID(thread_id), (err, docs) => {
      if (err) return console.error(err);
      // check password
      bcrypt.compare(delete_password, docs.delete_password, (err, hash) => {
        if (hash === false) return res.send("incorrect password");
        // delete thread
        else if (hash === true) {
          Board.findByIdAndDelete(objectID(thread_id), (err, docs) => {
            if (err) return console.error(err);
            return res.send("success");
          });
        }
      });
    });
  }

  // new reply to thread
 function newReply(req, res) {
    const { board } = req.params;
    const { thread_id, text, delete_password } = req.body;
    // invalid _id
    if (!mongoose.Types.ObjectId.isValid(thread_id))
      return res.send("Invalid _id");
    const Board = Model(board, BoardSchema);
    // hash PW
    bcrypt.hash(delete_password, saltRounds, (err, hash) => {
      if (err) return console.error(err);
      // push text and delete password into replies
      Board.findByIdAndUpdate(
        objectID(thread_id),
        {
          $push: {
            replies: {
              text: text,
              delete_password: hash
            }
          },
          bumped_on: Date.now()
        },
        { useFindAndModify: false },
        (err, docs) => {
          if (err) return console.error(err);
          // if no _id in DB
          if (!docs) return res.send("No _id found");
          return res.redirect(`/b/${board}/${thread_id}`);
        }
      );
    });
  }

  // report a reply
function   reportReply(req, res) {
    const { board } = req.params;
    const { thread_id, reply_id } = req.body;
    // invalid _id
    if (
      !mongoose.Types.ObjectId.isValid(thread_id) ||
      !mongoose.Types.ObjectId.isValid(reply_id)
    )
      return res.send("Invalid _id");
    const Board = Model(board, BoardSchema);
    Board.findOneAndUpdate(
      // set value of reported value for reply_id in thread_id
      { _id: objectID(thread_id), "replies._id": objectID(reply_id) },
      { $set: { "replies.$.reported": !false } },
      { useFindAndModify: false },
      (err, docs) => {
        if (err) return console.error(err);
        // _id not in DB
        if (!docs) res.send("No _id found");
        return res.send("success");
      }
    );
  }

  // delete a reply
 function  deleteReply(req, res) {
    const { board } = req.params;
    const { thread_id, reply_id, delete_password } = req.body;
    // invalid _id
    if (
      !mongoose.Types.ObjectId.isValid(thread_id) ||
      !mongoose.Types.ObjectId.isValid(reply_id)
    )
      return res.send("Invalid _id");
    const Board = Model(board, BoardSchema);
    // find reply_id in thread_id and get hashed PW
    Board.findOne(
      { _id: objectID(thread_id), "replies._id": objectID(reply_id) },
      "delete_password",
      (err, docs) => {
        if (err) return console.error(err);
        if (!docs) return res.send("No _id found");
        // check PW
        bcrypt.compare(delete_password, docs.delete_password, (err, check) => {
          if (err) return console.error(err);
          // incorrect PW
          if (check === false) return res.send("incorrect password");
          else if (check === true) {
            // find reply_id in thread_id to delete
            Board.findOneAndUpdate(
              { _id: objectID(thread_id), "replies._id": objectID(reply_id) },
              { $set: { replies: { text: "[deleted]" } } },
              { useFindAndModify: false },
              (err, docs) => {
                if (err) return console.error(err);
                // no _id in DB
                if (!docs) return res.send("No _id found");
                res.send("success");
              }
            );
          }
        });
      }
    );
  }

  // get most recent (by bumped_on date) 10 documents
  function getThreads(req, res) {
    const { board } = req.params;
    const Board = Model(board, BoardSchema);
    Board.find(
      {},
      // fields to exclude
      "-delete_password -reported -replies.delete_password -replies.reported",
      {
        limit: 10,
        sort: { bumped_on: -1 },
        lean: true
      },
      (err, docs) => {
        if (err) return console.error(err);
        if (!docs) return res.send("No results");
        // sort 3 most recent comments and add replycount to obj
        docs.map((doc) => {
          doc.replycount = doc.replies.length;
          doc.replies = doc.replies.slice(-3);
          doc.replies.reverse();
          return doc;
        });
        return res.send(docs);
      }
    );
  }

  // get full thread data including all replies
function  getFullThread(req, res) {
    const { board } = req.params;
    const { thread_id } = req.query;
    // invalid _id
    if (!mongoose.Types.ObjectId.isValid(thread_id))
      return res.send("Invalid _id");
    const Board = Model(board, BoardSchema);
    Board.findById(
      objectID(thread_id),
      // fields to exclude
      "-delete_password -reported -replies.delete_password -replies.reported",
      (err, docs) => {
        if (err) return console.error(err);
        if (!docs) return res.send("No results");
        // sort by most recent
        docs.replies.reverse();
        return res.send(docs);
      }
    );
  }

module.exports ={
    addBoard
}