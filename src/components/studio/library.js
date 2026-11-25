import frameModel from "../../assets/frame.glb";
import chargerModel from "../../assets/charger.glb";
import billMachineModel from "../../assets/billmachine.glb";

/**
 * Models that ship with the app and can be inserted into a studio scene
 * without uploading anything.
 */
export const STUDIO_LIBRARY = [
  { key: "frame", name: "Studio frame", format: "GLB", url: frameModel },
  { key: "charger", name: "Power charger", format: "GLB", url: chargerModel },
  { key: "billmachine", name: "Bill machine", format: "GLB", url: billMachineModel },
];

export default STUDIO_LIBRARY;
