


let globalNavigationRef: any = null;

export function setNavigationRef(ref: any) {
  globalNavigationRef = ref;
}

export function navigate(name: string, params?: any) {
  if (globalNavigationRef && globalNavigationRef.isReady()) {
    globalNavigationRef.navigate(name, params);
  }
}

export function setModalVisible(callback: (visible: boolean) => void) {
  
  modalCallback = callback;
}

let modalCallback: ((visible: boolean) => void) | null = null;
let newSubjectIdsCallback: ((ids: string[]) => void) | null = null;

export function setNewSubjectIds(callback: (ids: string[]) => void) {
  newSubjectIdsCallback = callback;
}

export function openSubjectsModal() {
  if (modalCallback) {
    modalCallback(true);
  }
}

export function openSubjectsModalWithMateria(materiaId: string) {
  
  if (newSubjectIdsCallback) {
    newSubjectIdsCallback([materiaId]);
  }
  
  
  if (modalCallback) {
    modalCallback(true);
  }
}
