import React, { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { InputMask } from "@react-input/mask";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import Button from "../../Standart/Button/Button";
import CreateRoomModal from "../CreateRoomModal/CreateRoomModal";
import { roles } from "../../../roles";

const AddPassengerModal = ({
  user,
  open,
  onClose,
  newPassengerData,
  setNewPassengerData,
  onAdd,
  currentHotelID,
  hotelRooms,
}) => {
  //   console.log(hotelRooms);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [openCreateRoomModal, setOpenCreateRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState(null);

  // Если появилось значение newRoom, выставляем его как выбранную комнату
  useEffect(() => {
    if (newRoom) {
      setSelectedRoom(newRoom);
      setNewPassengerData((prev) => ({
        ...prev,
        roomId: newRoom.id,
        hotelId: currentHotelID,
      }));
    }
  }, [newRoom]);

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle sx={{ textAlign: "center", paddingBottom: "5px" }}>
          Добавить пассажира
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "12px",
            width: "450px",
            height: "250px",
            padding: "12px 24px",
          }}
        >
          <input
            type="text"
            placeholder="ФИО пассажира"
            value={newPassengerData.name}
            onChange={(e) =>
              setNewPassengerData({ ...newPassengerData, name: e.target.value })
            }
          />
          <InputMask
            type="text"
            mask="+7 (___) ___-__-__"
            replacement={{ _: /\d/ }}
            name="number"
            value={newPassengerData.number}
            onChange={(e) =>
              setNewPassengerData({
                ...newPassengerData,
                number: e.target.value,
              })
            }
            placeholder="Номер телефона"
            autoComplete="new-password"
          />
          <MUIAutocomplete
            dropdownWidth={"100%"}
            label={"Выберите пол"}
            options={["Мужской", "Женский"]}
            value={newPassengerData.gender}
            onChange={(event, newValue) =>
              setNewPassengerData({ ...newPassengerData, gender: newValue })
            }
          />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MUIAutocomplete
              listboxHeight={"120px"}
              dropdownWidth={"100%"}
              label={"Выберите комнату для заселения"}
              options={hotelRooms?.map(
                (room) =>
                  `Номер ${room.name} (мест: ${room.places}) (состояние: ${
                    room.active ? "работает" : "не работает"
                  })`
              )}
              getOptionLabel={(option) => {
                // Можно вывести более читаемый текст
                return `Номер ${option.name} (мест: ${
                  option.places
                }) (состояние: ${option.active ? "работает" : "не работает"})`;
              }}
              // Сравниваем option и value по id, чтобы MUI знал, какой элемент выбран
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={(() => {
                const selectedRoom = hotelRooms?.find(
                  (room) => room.id === newPassengerData.roomId
                );
                return selectedRoom
                  ? `Номер ${selectedRoom.name} (мест: ${
                      selectedRoom.places
                    }) (состояние: ${
                      selectedRoom.active ? "работает" : "не работает"
                    })`
                  : "";
              })()}
              onChange={(event, newValue) => {
                const select = hotelRooms?.find(
                  (room) =>
                    `Номер ${room.name} (мест: ${room.places}) (состояние: ${
                      room.active ? "работает" : "не работает"
                    })` === newValue
                );
                // console.log(select);
                setNewPassengerData({
                  ...newPassengerData,
                  roomId: select?.id || "",
                  hotelId: currentHotelID,
                });
                setSelectedRoom(select);
              }}
            />
            {user.role === roles.airlineAdmin ? null : (
              <Button
                onClick={() => setOpenCreateRoomModal(true)}
                padding={"0 15px"}
              >
                <img
                  style={{ width: "14px", objectFit: "contain" }}
                  src="/plus.png"
                  alt=""
                />
              </Button>
            )}
          </div>

          {newPassengerData.roomId ? (
            <MUIAutocomplete
              listboxHeight="120px"
              dropdownWidth="100%"
              label="Выберите место"
              options={Array.from({ length: selectedRoom.places }, (_, i) =>
                String(i + 1)
              )}
              // getOptionLabel здесь уже не нужен, так как опции – строки
              value={
                newPassengerData.place ? String(newPassengerData.place) : null
              }
              onChange={(event, newValue) => {
                setNewPassengerData({
                  ...newPassengerData,
                  place: Number(newValue),
                });
              }}
            />
          ) : null}
        </DialogContent>
        <DialogActions
          sx={{
            padding: "0 24px 12px 24px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button onClick={onClose} width={"48%"}>
            Отмена
          </Button>
          <Button onClick={onAdd} width={"48%"}>
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
      <CreateRoomModal
        open={openCreateRoomModal}
        onClose={() => setOpenCreateRoomModal(false)}
        hotelId={currentHotelID}
        setNewRoom={setNewRoom}
      />
    </>
  );
};

export default AddPassengerModal;
