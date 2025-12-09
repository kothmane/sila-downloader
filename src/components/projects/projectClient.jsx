import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { useData } from "@/contexts/operationProvider";
import { getPeriodInMongoFilterFormat } from "@/utils/helper";
import ProjectCard from "./projectCard";
import Spinner from "../basic/spinner";
import { useSettings } from "@/contexts/settingsProvider";
import { IconPlayerPlayFilled, IconPlayerPauseFilled, IconTrash } from "@tabler/icons-react";
import SelectionInfo from "./selectionInfo";
import File from "@/components/projects/file";  
import { useAuth } from "@/contexts/authProvider";



const ProjectsClient = React.memo(({className}) => {
  const { data, fetchData, setOperationData } = useData();
  const { settings } = useSettings();
  const { admin, adminHasRole } = useAuth();
  
  const processProject = useCallback((data) => {
    const files = data.footage.files.filter(file => file.status == "completed");
    const finalResult = {};
    const admin_uid = admin.uid;

    // case of image project
    const ImageProject = data.type == "image";
    if (ImageProject) {
      if (data.photoEmployee == admin_uid)
        finalResult.files = files;
      else 
        finalResult.files = [];
      
      finalResult.categorized = false;
      return finalResult;
    }

    // case of video project

  
    // next we determine the index of the steps this admin is assigned to
    const videoCategories = [];
    for (let i = 0; i < data.content.length; i++) {
      // check if any editing step is assigned to this admin
      const editingSteps = data.content[i].steps.filter(step => (step.name == "editing" && step.worker_uid == admin_uid) || adminHasRole("superAdmin"));
      if (editingSteps.length > 0) {
        videoCategories.push(i + 1);
      }
    }

    if (videoCategories.length == 0) {
      finalResult.files = [];
      finalResult.categorized = false;
      return finalResult;
    }

    // in case there is only one video in the project, we return the files directly
    if (videoCategories.length == 1 && data.number == 1) {
      finalResult.files = files;
      finalResult.categorized = false;
      return finalResult;
    } else {
      finalResult.categorized = true;
    }

    // for each category that is assigned to this admin, we find the files corresponding to it

    finalResult.categories = {};
    for (const category of videoCategories) {
      let categoryFiles = [];
      categoryFiles = files.filter(file => file.attributes.some(attribute => attribute == `n_${category}`));
      finalResult.categories[category] = categoryFiles;
    }

    const unasignedFiles = files.filter(file => !file.attributes.some(attribute => attribute.startsWith("n_")));
    if (unasignedFiles.length > 0) {
      finalResult.categories["extra"] = unasignedFiles;
    }
    
    
    return finalResult;
  }, [admin.uid]);

  const footageKey = `footage-${settings.selectedProject?._id}`;
  // Initial data fetch
  useEffect(() => {
    if (settings.selectedProject?._id) {
      fetchData({
        key: footageKey,
        collection: "ShootingProject",
        operationName: "getFullProjectInfo",
        operationData: {_id: settings.selectedProject?._id},
        dataProcessor: processProject
      });
    }
  }, [settings.selectedProject?._id]);

  const footageReady = useMemo(() => data?.[footageKey]?.valid, [data, settings]);
  const projectsReady = useMemo(() => data?.projects?.valid, [data]);
  const footage = useMemo(() => data?.[footageKey]?.data || [], [data, settings]);

  if (!projectsReady) {
    return <Spinner></Spinner>;
  }

  if (!settings || !settings.selectedProject?._id) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p>No project selected</p>
      </div>
    ) 
  }

  if (!footageReady) {
    return <Spinner></Spinner>;
  }

  const categorized = footage.categorized;

  if (!categorized && footage.files.length == 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p>No files found</p>
      </div>
    )
  }

  else if (!categorized) {
    return (
      <div className={`${className} p-4 @container`}>
        <div className="grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-4 h-fit">
          {footage.files.map((file) => (
            <File key={file._id} file={file} />
          ))}
        </div>
      </div>
    );
  }

  const currentCategory = settings.selectedCategory;


  // in this case we get all the files no exception
  if (currentCategory == null) {
    return (
      <div className={`${className} p-4`}>
        <div className="grid grid-cols-3 gap-4 h-fit">
          {Object.values(footage.categories).flat().map((file) => (
            <File key={file._id} file={file} />
          ))}
        </div>
      </div>
    );
  } else {
    return (
      <div className={`${className} p-4`}>
        <div className="grid grid-cols-3 gap-4 h-fit">
          {footage.categories[currentCategory].map((file) => (
            <File key={file._id} file={file} />
          ))}
        </div>
      </div>
    );
  }


  return null;
});


export default ProjectsClient;
