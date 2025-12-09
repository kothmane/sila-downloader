import React, { useMemo } from "react";


const ProjectCard = React.memo(({ project, onClick, selected }) => {

  const renderedResult = useMemo(() => (
    <div onClick={onClick} className={`flex flex-col gap-2 p-4 rounded-md  ${selected ? "bg-lightest" : "bg-light"} cursor-pointer`}>
      <p>{project.name}</p>
      <div className="flex gap-2">
        <p>{project.type}</p> 
        <p>x {project.number}</p>
      </div>
    </div>
    ), [project, onClick]);

  return renderedResult;
});

export default ProjectCard;