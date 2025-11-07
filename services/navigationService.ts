// Este archivo exporta una referencia compartida para la navegación
// El navigationRef real se crea en App.tsx

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
  // Este callback se establecerá desde HomeScreen
  modalCallback = callback;
}

let modalCallback: ((visible: boolean) => void) | null = null;

export function openSubjectsModal() {
  if (modalCallback) {
    modalCallback(true);
  }
}
