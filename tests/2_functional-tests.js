const chaiHttp = require("chai-http");
const chai = require("chai");
const mongoose = require("mongoose");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

// get thread_id and reply_id for testing
let thread_id;
let reply_id;

suite("Functional Tests", function () {
  suite("POST request (/api/threads/{board})", () => {
    test("Creating a new thread", (done) => {
      chai
        .request(server)
        .post("/api/threads/test")
        .send({
          text: "thread",
          delete_password: "password"
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          done();
        });
    });
  });

  suite("GET request (/api/threads/{board})", () => {
    test("Viewing 10 most recent threads with 3 replies each", (done) => {
      chai
        .request(server)
        .get("/api/threads/test")
        .end((err, res) => {
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtMost(res.body.length, 10);
          thread_id = res.body[0]._id;
          done();
        });
    });
  });

  suite("PUT request (/api/threads/{board})", () => {
    test("Reporting a thread", (done) => {
      chai
        .request(server)
        .put("/api/threads/test")
        .send({
          thread_id: thread_id
        })
        .end((err, res) => {
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, "success");
          done();
        });
    });
  });

  suite("POST request (/api/replies/{board})", () => {
    test("Creating a new reply", (done) => {
      chai
        .request(server)
        .post("/api/replies/test")
        .send({
          thread_id: thread_id,
          text: "text",
          delete_password: "password"
        })
        .end((err, res) => {
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.notEqual(res.text, "Invalid _id");
          assert.notEqual(res.text, "No _id found");
          done();
        });
    });
  });

  suite("GET request (/api/replies/{board})", () => {
    test("Viewing a single thread with all replies", (done) => {
      chai
        .request(server)
        .get("/api/replies/test")
        .query({ thread_id: thread_id })
        .end((err, res) => {
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.property(res.body, "_id");
          assert.property(res.body, "created_on");
          assert.property(res.body, "bumped_on");
          assert.property(res.body, "text");
          assert.isArray(res.body.replies);
          reply_id = res.body.replies[0]._id;
          done();
        });
    });
  });

  suite("PUT request (/api/replies/{board})", () => {
    test("Reporting a reply", (done) => {
      chai
        .request(server)
        .put("/api/replies/test")
        .send({
          thread_id: thread_id,
          reply_id: reply_id
        })
        .end((err, res) => {
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, "success");
          done();
        });
    });
  });

  suite("DELETE request (/api/replies/{board})", () => {
    test("Deleting a reply with an invalid delete_password", (done) => {
      chai
        .request(server)
        .delete("/api/replies/test")
        .send({
          thread_id: thread_id,
          reply_id: reply_id,
          delete_password: "someincorrectpassword"
        })
        .end((err, res) => {
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, "incorrect password");
          done();
        });
    });

    test("Deleting a reply with the correct delete_password", (done) => {
      chai
        .request(server)
        .delete("/api/replies/test")
        .send({
          thread_id: thread_id,
          reply_id: reply_id,
          delete_password: "password"
        })
        .end((err, res) => {
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, "success");
          done();
        });
    });
  });

  suite("DELETE request (/api/threads/{board})", () => {
    test("Deleting a thread with the incorrect password", (done) => {
      chai
        .request(server)
        .delete("/api/threads/test")
        .send({
          thread_id: thread_id,
          delete_password: "someincorrectpassword"
        })
        .end((err, res) => {
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, "incorrect password");
          done();
        });
    });

    test("Deleting a thread with the correct password", (done) => {
      chai
        .request(server)
        .delete("/api/threads/test")
        .send({ thread_id: thread_id, delete_password: "password" })
        .end((err, res) => {
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, "success");
          done();
        });
    });
  });
});
