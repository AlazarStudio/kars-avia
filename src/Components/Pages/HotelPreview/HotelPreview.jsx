import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { AUTHORIZE_HOTEL_PREVIEW } from "../../../../graphQL_requests";
import HotelAbout_tabComponent from "../../Blocks/HotelAbout_tabComponent/HotelAbout_tabComponent";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import classes from "./HotelPreview.module.css";

function HotelPreview() {
  const [searchParams] = useSearchParams();
  const rawToken = searchParams.get("token")?.trim();

  const [status, setStatus] = useState("authorizing"); // authorizing | ready | error
  const [previewToken, setPreviewToken] = useState(null);
  const [errorText, setErrorText] = useState("");

  const [authorizeHotelPreview] = useMutation(AUTHORIZE_HOTEL_PREVIEW);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!rawToken) {
        setErrorText("Ссылка недействительна: отсутствует токен.");
        setStatus("error");
        return;
      }
      try {
        const res = await authorizeHotelPreview({
          variables: { token: rawToken },
        });
        const data = res?.data?.authorizeHotelPreview;
        if (cancelled) return;
        if (!data?.token) {
          setErrorText("Ссылка недействительна или истекла.");
          setStatus("error");
          return;
        }
        sessionStorage.setItem("hotelPreviewToken", data.token);
        setPreviewToken(data.token);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setErrorText("Ссылка недействительна или истекла.");
        setStatus("error");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [rawToken, authorizeHotelPreview]);

  return (
    <div className={classes.previewPage}>
      <header className={classes.previewHeader}>
        <span className={classes.previewLogo}>Kars Avia</span>
      </header>
      <main className={classes.previewBody}>
        {status === "authorizing" && <MUILoader fullHeight={"70vh"} />}
        {status === "error" && (
          <div className={classes.previewError}>
            <p>{errorText}</p>
          </div>
        )}
        {status === "ready" && previewToken && (
          <HotelAbout_tabComponent isPreview previewToken={previewToken} />
        )}
      </main>
    </div>
  );
}

export default HotelPreview;
