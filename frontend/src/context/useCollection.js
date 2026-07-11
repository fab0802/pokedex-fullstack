import { useContext } from "react";
import { CollectionContext } from "./collectionContextObject";

export function useCollection() {
  return useContext(CollectionContext);
}
