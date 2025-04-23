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

function TextEditor({ hotel, isEditing, onChange }) {
  const [description, setDescription] = useState(
    hotel.information?.description || ""
  );

  useEffect(() => {
    setDescription(hotel.information?.description || "");
  }, [hotel]);

  useEffect(() => {
    if (isEditing && !description) {
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
