import "mutation-events";
import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import TextEditorOutput from "../TextEditorOutput/TextEditorOutput";
import "react-quill/dist/quill.snow.css";
import "./TextEditor.module.css";

const TEMPLATE_CONTENT = `
  <p>Название гостиницы: </p>
  <p>Локация: </p>
  <p>Инфраструктура: </p>
  <p>Оснащение объекта: </p>
  <p>Оснащение номерного фонда: </p>
  <p>Услуги прачечной/глажки: </p>
`;

const toolbarOptions = [
  // [{ size: ["small", false, "large", "huge"] }], // custom dropdown
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  ["bold", "italic", "underline", "strike"], // toggled buttons
  // ["blockquote", "code-block"],
  // ["link", "image", "video", "formula"],
  ["link"],

  // [{ header: 1 }, { header: 2 }], // custom button values
  // [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
  [{ list: "ordered" }, { list: "bullet" }],
  // [{ script: "sub" }, { script: "super" }], // superscript/subscript
  [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
  // [{ direction: "rtl" }], // text direction

  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  // [{ font: [] }],
  [{ align: [] }],

  ["clean"], // remove formatting button
];

function TextEditor({ hotel, anotherDescription, isEditing, onChange }) {
  const [description, setDescription] = useState(
    hotel ? hotel.information?.description : anotherDescription
  );
  // console.log(hotel)

  useEffect(() => {
    setDescription(hotel ? hotel.information?.description : anotherDescription);
  }, [hotel, anotherDescription]);

  useEffect(() => {
    if (isEditing && !description && !anotherDescription && hotel) {
      setDescription(TEMPLATE_CONTENT);
      onChange(TEMPLATE_CONTENT);
    }
  }, [isEditing]);

  const handleChange = (content) => {
    setDescription(content);
    onChange(content);
  };

  return isEditing ? (
    <div>
      <ReactQuill
        value={description}
        onChange={handleChange}
        modules={{ toolbar: toolbarOptions }}
      />
    </div>
  ) : (
    <TextEditorOutput description={description} />
  );
}

export default TextEditor;
