import { IconArrowBackUp } from "@tabler/icons-react";
import { useNavigate } from "react-router";


export default function ReturnArrow({}) {
  const navigate = useNavigate();

  const handleReturn = () => {
    navigate(-1);
  };

  return (
    <button className="flex gap-2 items-center" onClick={handleReturn}>
      <IconArrowBackUp size={24} className="muted-text-color" />
      <p className="muted-text-color">Return</p>
    </button>
  );
}