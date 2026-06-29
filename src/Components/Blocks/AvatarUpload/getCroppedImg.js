// Создаёт обрезанный File из исходного изображения и области кропа (croppedAreaPixels из react-easy-crop)
function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.src = url;
  });
}

export default async function getCroppedImg(
  imageSrc,
  croppedAreaPixels,
  fileName = "avatar.png",
  outputSize = 512
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Квадратный вывод фиксированного размера — аватар круглый, режем по квадрату
  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Не удалось обрезать изображение"));
        return;
      }
      const safeName = fileName.replace(/\.[^.]+$/, "") + ".png";
      const file = new File([blob], safeName, { type: "image/png" });
      resolve(file);
    }, "image/png");
  });
}
