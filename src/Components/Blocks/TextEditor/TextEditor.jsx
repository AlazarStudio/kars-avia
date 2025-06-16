import "mutation-events";
import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const TEMPLATE_CONTENT = `
  <p>Название гостиницы: </p>
  <p>Локация: </p>
  <p>Инфраструктура: </p>
  <p>Оснащение объекта: </p>
  <p>Оснащение номерного фонда: </p>
  <p>Услуги прачечной/стирки: </p>
`;

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
      <ReactQuill value={description} onChange={handleChange} />
    </div>
  ) : (
    <div dangerouslySetInnerHTML={{ __html: description }} />
  );
}

export default TextEditor;
