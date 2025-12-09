import Dialog from "@/components/basic/dialog";
import { useRef } from "react";

const ImageDisplayDialog = ({image, className}) => {
  const innerRef = useRef(null);

  return (
    <>
      <img className={className} src={image.thumbnail_file.url} alt={image.name} onClick={() => innerRef.current.open()} />
      <Dialog ref={innerRef}>
        <img src={image.original_file.url} alt={image.name} />
      </Dialog>
    </>
    
  );
};

export default ImageDisplayDialog;