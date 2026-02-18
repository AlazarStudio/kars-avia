import React, { useEffect, useState } from "react";
import classes from "./InfoTableDataUpdates.module.css";
import { Modal, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useQuery } from "@apollo/client";
import { GET_DOCUMENTATION_TREE, server } from "../../../../graphQL_requests";
import MUILoader from "../MUILoader/MUILoader";
import { roles } from "../../../roles";

function DocNode({ node, openModal }) {
  return (
    <div className={classes.node}>
      <h4 className={classes.nodeTitle}>{node.name}</h4>

      {/* HTML-описание узла */}
      <div dangerouslySetInnerHTML={{ __html: node.description }} />

      {/* Файлы, если есть */}
      {!!node.images?.length && (
        <div className={classes.files}>
          {node.images.map((i, index) => (
            <img
              key={index}
              src={`${server}${i}`}
              alt=""
              loading="lazy"
              onClick={() => openModal(`${server}${i}`)}
            />
          ))}
        </div>
      )}

      {/* Дети */}
      {!!node.children?.length && (
        <div className={classes.children}>
          {node.children.map((child) => (
            <DocNode key={child.id} node={child} openModal={openModal} />
          ))}
        </div>
      )}
    </div>
  );
}

function InfoTableDataUpdates({
  user,
  token,
  filterValue,
  requests,
  toggleRequestSidebar,
}) {
  // State for selected documentation item ID
  const [selectedId, setSelectedId] = useState(
    requests.length > 0 ? requests[0].id : null
  );

  // State for modal
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  // Fetch details for the selected documentation
  const { loading, error, data } = useQuery(GET_DOCUMENTATION_TREE, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { documentationTreeId: selectedId },
    skip: !selectedId,
  });

  // If requests update (e.g. refetch), ensure a valid selectedId
  // useEffect(() => {
  //   if (!selectedId && requests.length > 0) {
  //     setSelectedId(requests[0]?.id);
  //   }
  // }, [requests, selectedId, filterValue]);
  useEffect(() => {
    setSelectedId(requests.length ? requests[0].id : null);
  }, [requests]); // этого достаточно; filterValue сюда не нужен

  const openModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedImage("");
  };

  return (
    <div className={classes.container}>
      {/* Left panel: list of documentation names */}
      <nav className={classes.sidebar}>
        {requests.map((item) => (
          <div
            key={item.id}
            className={`${classes.navContainer} ${
              item.id === selectedId && classes.active
            }`}
          >
            <div
              className={
                // item.id === selectedId
                //   ? `${classes.navItem} ${classes.active}`
                //   :
                classes.navItem
              }
              onClick={() => setSelectedId(item.id)}
            >
              {item.name}
            </div>
            {user?.role === roles.superAdmin && (
              <div
                className={classes.editItem}
                onClick={() => toggleRequestSidebar(item)}
              >
                {/* <img src="/public/editIcon.png" alt="" /> */}
                {/* <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.21617 13.5C1.01607 13.4997 0.825314 13.4153 0.690445 13.2674C0.553089 13.1207 0.484836 12.9224 0.502838 12.7223L0.677604 10.8L8.75113 2.72713L11.2742 5.25017L3.20281 13.3223L1.28109 13.4971C1.25897 13.4993 1.23686 13.5 1.21617 13.5ZM11.7778 4.74571L9.25545 2.22266L10.7684 0.709269C10.9022 0.575284 11.0838 0.5 11.2731 0.5C11.4624 0.5 11.644 0.575284 11.7778 0.709269L13.2908 2.22266C13.4247 2.3565 13.5 2.53811 13.5 2.72749C13.5 2.91686 13.4247 3.09847 13.2908 3.23231L11.7785 4.74499L11.7778 4.74571Z"
                    fill={
                      item.id === selectedId ? "var(--dark-blue)" : "var(--main-gray)"
                    }
                  />
                </svg> */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.73267 3.42255C6.48981 3.47969 5.27267 3.61397 4.08552 3.75112C3.4164 3.83003 2.79351 4.13251 2.31774 4.60958C1.84197 5.08665 1.54119 5.71036 1.4641 6.37969C1.29267 7.91969 1.12695 9.51255 1.12695 11.1411C1.12695 12.7711 1.29267 14.364 1.4641 15.9054C1.61838 17.2768 2.7141 18.3725 4.08552 18.5311C5.6341 18.7097 7.2341 18.8883 8.87124 18.8883C10.5098 18.8883 12.1098 18.7097 13.6584 18.5311C14.3268 18.452 14.949 18.1498 15.4245 17.6734C15.8999 17.1969 16.2008 16.574 16.2784 15.9054C16.4141 14.7754 16.5151 13.6416 16.5812 12.5054"
                    stroke={
                      item.id === selectedId
                        ? "var(--dark-blue)"
                        : "var(--main-gray)"
                    }
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14.4724 1.84112L9.20812 7.81255L8.48812 11.2054C8.37097 11.7511 8.94097 12.2683 9.47383 12.0997L12.8481 11.0397L18.2853 5.31826C19.1895 4.36826 19.031 2.77826 17.9381 1.81112C16.871 0.868263 15.3195 0.88112 14.4724 1.84112Z"
                    stroke={
                      item.id === selectedId
                        ? "var(--dark-blue)"
                        : "var(--main-gray)"
                    }
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {/* <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 2048 2048"
                >
                  <path
                    fill={item.id === selectedId ? "var(--dark-blue)" : "var(--main-gray)"}
                    d="M0 256h640v1536H0zm128 1408h384V384H128zM2048 256v540q-29-19-61-31t-67-19V384H896v1155l-128 157V256zm-200 640q42 0 78 15t64 42t42 63t16 78q0 39-15 76t-43 65l-717 719l-377 94l94-377l717-718q28-28 65-42t76-15m51 249q21-21 21-51q0-31-20-50t-52-20q-14 0-27 4t-23 15l-692 694l-34 135l135-34z"
                  />
                </svg> */}
                {/* <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill={item.id === selectedId ? "var(--dark-blue)" : "var(--main-gray)"}
                    d="M3 6.25A3.25 3.25 0 0 1 6.25 3h11.5A3.25 3.25 0 0 1 21 6.25v4.762a3.3 3.3 0 0 0-1.5.22V6.25a1.75 1.75 0 0 0-1.75-1.75H6.25A1.75 1.75 0 0 0 4.5 6.25v11.5c0 .966.784 1.75 1.75 1.75h5.291l-.02.077L11.165 21H6.25A3.25 3.25 0 0 1 3 17.75zM15.355 15l-1.5 1.5H11.25a.75.75 0 1 1 0-1.5zM7.75 9.25a1 1 0 1 0 0-2a1 1 0 0 0 0 2m3.5-1.75a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5zM10.5 12a.75.75 0 0 1 .75-.75h5.5a.75.75 0 1 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75m-2.75 1a1 1 0 1 0 0-2a1 1 0 0 0 0 2m0 3.75a1 1 0 1 0 0-2a1 1 0 0 0 0 2m11.35-4.08l-5.903 5.902a2.7 2.7 0 0 0-.706 1.247l-.458 1.831a1.087 1.087 0 0 0 1.319 1.318l1.83-.457a2.7 2.7 0 0 0 1.248-.707l5.902-5.902A2.286 2.286 0 0 0 19.1 12.67"
                  />
                </svg> */}
                {/* <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill={item.id === selectedId ? "var(--dark-blue)" : "var(--main-gray)"}
                    d="M5 1a.5.5 0 0 1 .5.5V2h2v-.5a.5.5 0 0 1 1 0V2h2v-.5a.5.5 0 0 1 1 0V2A1.5 1.5 0 0 1 13 3.5v2.536a2.55 2.55 0 0 0-1 .406V3.5a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h1.547v.002a1.6 1.6 0 0 0 .068.998H4.5A1.5 1.5 0 0 1 3 13.5v-10A1.5 1.5 0 0 1 4.5 2v-.5A.5.5 0 0 1 5 1m5 7c.107 0 .206.034.288.091L9.378 9H6a.5.5 0 0 1 0-1zm-3.004 3.435A.5.5 0 0 0 6.5 11H6a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 .157-.025q.146-.284.339-.54M6 5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1zm6.338 2.455a1.56 1.56 0 0 1 2.207 2.207l-4.289 4.288a2.8 2.8 0 0 1-1.29.731l-1.211.303a.61.61 0 0 1-.74-.74l.304-1.21c.122-.489.374-.935.73-1.29z"
                  />
                </svg> */}
                {/* <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill={item.id === selectedId ? "var(--dark-blue)" : "var(--main-gray)"}
                    d="M3.005 14.176A3 3 0 0 0 6 17h2.003q.01-.171.054-.347L8.22 16H6l-.15-.005A2 2 0 0 1 4 14v-4h3l.176-.005A3 3 0 0 0 10 7V4h4l.15.005A2 2 0 0 1 16 6v2.003a2.9 2.9 0 0 1 1 .13V6l-.005-.176A3 3 0 0 0 14 3H9.621l-.176.008a2 2 0 0 0-1.238.578L3.586 8.207l-.12.13A2 2 0 0 0 3 9.62V14zM7 9l-2.782-.001q.034-.045.075-.085l4.621-4.621L9 4.219V7l-.005.15A2 2 0 0 1 7 9m2.98 5.377l4.83-4.83a1.87 1.87 0 1 1 2.644 2.646l-4.83 4.829a2.2 2.2 0 0 1-1.02.578l-1.498.374a.89.89 0 0 1-1.079-1.078l.375-1.498a2.2 2.2 0 0 1 .578-1.02"
                  />
                </svg> */}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Right panel: detail view for selected documentation */}
      <section className={classes.detailPane}>
        {loading && <MUILoader />}
        {error && (
          <div className={classes.error}>
            <strong>Ошибка:</strong> {error.message}
            {!!error.graphQLErrors?.length && (
              <ul>
                {error.graphQLErrors.map((e, i) => (
                  <li key={i}>{e.message}</li>
                ))}
              </ul>
            )}
            {error.networkError && <div>Сетевой сбой</div>}
          </div>
        )}
        {data && data.documentationTree && (
          <article className={classes.content}>
            <p className={classes.title}>{data.documentationTree.name}</p>
            {/* <p className={classes.meta}>
              <strong>Категория:</strong> {data.documentationTree?.category} |
              <strong>Подкатегория:</strong> {data.documentationTree?.chapter}
            </p> */}
            <div
              className={classes.description}
              dangerouslySetInnerHTML={{
                __html: data.documentationTree.description,
              }}
            />
            {!!data.documentationTree.images?.length && (
              <div className={classes.files}>
                {data.documentationTree.images.map((i, index) => (
                  <img
                    key={index}
                    src={`${server}${i}`}
                    alt=""
                    loading="lazy"
                    onClick={() => openModal(`${server}${i}`)}
                  />
                ))}
              </div>
            )}
            {/* Всё дерево целиком */}
            {!!data.documentationTree.children?.length && (
              <div className={classes.tree}>
                {data.documentationTree.children.map((n) => (
                  <DocNode key={n.id} node={n} openModal={openModal} />
                ))}
              </div>
            )}
            {/* {data.getDocumentation.files && data.getDocumentation.files.length > 0 && (
              <div className={classes.files}>
                <h3>Attachments:</h3>
                <ul>
                  {data.getDocumentation.files.map((url, i) => (
                    <li key={i}>
                      <a href={url} target="_blank" rel="noreferrer">
                        File {i + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )} */}
          </article>
        )}
      </section>
      <Modal open={modalIsOpen} onClose={closeModal} className={classes.modal}>
        <Box className={classes.modalContent}>
          <IconButton
            className={classes.closeButton}
            onClick={closeModal}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "white",
              backgroundColor: "rgba(0,0,0,0.5)",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.7)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          <img
            src={selectedImage}
            alt="Увеличенное изображение"
            className={classes.modalImage}
          />
        </Box>
      </Modal>
    </div>
  );
}

export default InfoTableDataUpdates;
