import { useMemo } from "react";
import classes from "./HotelAboutDescription.module.css";
import TextEditorOutput from "../TextEditorOutput/TextEditorOutput.jsx";
import { parseHotelDescription } from "../../../utils/hotelDescription.js";

// Описание гостиницы — свободный rich-text. Держится конвенции
// «жирный лейбл: значение» — рисуем сеткой; не держится — отдаём прежним
// сплошным рендером. Ряд чипов удобств рисует родитель: внутри клампа
// описания он съедал первый экран.
function HotelAboutDescription({ description }) {
  const { items, restHtml, parsed } = useMemo(
    () => parseHotelDescription(description),
    [description]
  );

  if (!parsed) return <TextEditorOutput description={description} />;

  return (
    <div className={classes.root}>
      <div className={classes.items}>
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`} className={classes.item}>
            <span className={classes.itemLabel}>{item.label}</span>
            <span
              className={classes.itemValue}
              dangerouslySetInnerHTML={{ __html: item.valueHtml }}
            />
          </div>
        ))}
      </div>

      {restHtml && (
        <div className={classes.rest}>
          <TextEditorOutput description={restHtml} />
        </div>
      )}
    </div>
  );
}

export default HotelAboutDescription;
