import { useState } from "react";
import Spinner from "./spinner";

const AsyncButton = ({children, onClick, className}) => {

  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    await onClick();
    setIsLoading(false);
  }

  return (
    <button type="submit" className={`${className}`} onClick={handleClick} disabled={isLoading}>
      { isLoading && <Spinner /> }
      { !isLoading && children }
    </button>
  )
}

export default AsyncButton;