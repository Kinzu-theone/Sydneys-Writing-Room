from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import Optional
import uuid
import json
import os
from datetime import datetime

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

NOTES_FILE = "notes.json"


def load_notes():
    if os.path.exists(NOTES_FILE):
        with open(NOTES_FILE, "r") as f:
            return json.load(f)
    return []


def save_notes(notes):
    with open(NOTES_FILE, "w") as f:
        json.dump(notes, f, indent=2)


class Note(BaseModel):
    title: str
    content: str
    tag: Optional[str] = ""
    color: Optional[str] = "#2d2d2d"
    pinned: Optional[bool] = False
    archived: Optional[bool] = False


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/notes")
async def get_notes():
    return load_notes()


@app.post("/api/notes")
async def create_note(note: Note):
    notes = load_notes()
    new_note = {
        "id": str(uuid.uuid4()),
        "title": note.title,
        "content": note.content,
        "tag": note.tag,
        "color": note.color,
        "pinned": note.pinned,
        "archived": note.archived,
        "created_at": datetime.now().strftime("%B %d, %Y %I:%M %p"),
    }
    notes.append(new_note)
    save_notes(notes)
    return new_note


@app.put("/api/notes/{note_id}")
async def update_note(note_id: str, note: Note):
    notes = load_notes()
    for n in notes:
        if n["id"] == note_id:
            n["title"] = note.title
            n["content"] = note.content
            n["tag"] = note.tag
            n["color"] = note.color
            save_notes(notes)
            return n
    return JSONResponse(status_code=404, content={"error": "Not found"})


@app.patch("/api/notes/{note_id}/pin")
async def toggle_pin(note_id: str):
    notes = load_notes()
    for n in notes:
        if n["id"] == note_id:
            n["pinned"] = not n["pinned"]
            save_notes(notes)
            return n
    return JSONResponse(status_code=404, content={"error": "Not found"})


@app.patch("/api/notes/{note_id}/archive")
async def toggle_archive(note_id: str):
    notes = load_notes()
    for n in notes:
        if n["id"] == note_id:
            n["archived"] = not n["archived"]
            save_notes(notes)
            return n
    return JSONResponse(status_code=404, content={"error": "Not found"})


@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: str):
    notes = load_notes()
    notes = [n for n in notes if n["id"] != note_id]
    save_notes(notes)
    return {"success": True}
