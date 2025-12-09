import { useRef, useEffect, useMemo, useCallback } from "react";
import { useData } from "@/contexts/operationProvider";
import { getPeriodInMongoFilterFormat } from "@/utils/helper";
import ProjectCard from "./projectCard";
import Spinner from "../basic/spinner";
import { useSettings } from "@/contexts/settingsProvider";

const ProjectsClient = () => {
  const { data, fetchData, setOperationData } = useData();
  const { settings, updateSettings } = useSettings();
  // Initial data fetch
  useEffect(() => {
    
    fetchData({
      key: "projects",
      collection: "ShootingProject",
      operationName: "getAdminItems",
      dataProcessor: (data) => {
        console.log("we received the following data", data);

        return data.reverse();
      }
    });

  }, []);

  const projectsReady = useMemo(() => data?.projects?.valid, [data]);
  const projects = useMemo(() => data?.projects?.data || [], [data]);
    
  const handleProjectClick = useCallback((project) => {
    updateSettings({selectedProject: project, selectedFiles: {}, selectedCategory: null});
  }, []);


  const renderedResult = useMemo(() => (
    <div>
      <h1>Projects</h1>
      <div className="flex flex-col gap-2">
        {projects.map(p=> p.itemStatus.project).map((project) => (
          <ProjectCard key={project._id} selected={settings.selectedProject?._id == project._id} onClick={() => handleProjectClick(project)} project={project} />
        ))}
      </div>
    </div>
  ), [projects, settings.selectedProject]);



  if (!projectsReady) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner></Spinner>
      </div>
    );
  }


  return (
    renderedResult
  );

}


export default ProjectsClient;
