const express = require("express");
const path = require("node:path");
const app = express();
const { v4: uuidv4 } = require('uuid');
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
const port = 8080;
// to Parse the data
app.use(express.urlencoded({extended : true})); 

// Setting path of view and public
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

let posts = [
    {
        id : uuidv4(),
        username : "NikhilPawar",
        content : "I love playing game!"
    },
     {
        id : uuidv4(),
        username : "HarishPawar",
        content : "I love playing Cricket!"
    },
     {
        id : uuidv4(),
        username : "Gurav",
        content : "I love to playing with girls!"
    },   
];

app.get("/posts", (req, res) => {
    res.render("index.ejs", {posts});
});

app.get("/posts/addPost", (req, res) => {
    res.render("addPost.ejs")
});

app.post("/posts", (req, res) => {
    let {username, content} = req.body;
    let id = uuidv4();
    posts.push({id, username,content});
    res.redirect("/posts");
});

app.get("/posts/:id", (req, res) => {
    let {id} = req.params;
    let post = posts.find((p) => id === p.id);
    res.render("show.ejs", {post}); 
});

app.patch("/posts/:id", (req, res) => {
    let {id} = req.params;
    let post = posts.find((p) => id === p.id);
    post.content = req.body.content;
    res.redirect("/posts");
});

app.get("/posts/:id/edit", (req, res) =>{
    let {id} = req.params;
    let post = posts.find((p) => id === p.id);
    res.render("edit.ejs", {post});
});

app.delete("/posts/:id", (req, res)=> {
    let {id} = req.params;
    posts = posts.filter((p) => id !== p.id);
    res.redirect("/posts");
})
app.listen(port, () => {
    console.log("Port is listening to : 8080");
});