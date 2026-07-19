import { Menu, app, shell, type MenuItemConstructorOptions } from 'electron'

// L'interfaccia dell'app è autosufficiente (tutte le azioni sono nella UI),
// quindi teniamo la barra dei menu minimale. Su macOS il menu applicazione
// resta comunque necessario per le scorciatoie di sistema (Cmd+Q, Cmd+C/V…).
export function buildAppMenu(): Menu | null {
  if (process.platform !== 'darwin') {
    return null
  }

  const template: MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about', label: 'Informazioni su DottorTime' },
        { type: 'separator' },
        { role: 'services', label: 'Servizi' },
        { type: 'separator' },
        { role: 'hide', label: 'Nascondi DottorTime' },
        { role: 'hideOthers', label: 'Nascondi altri' },
        { role: 'unhide', label: 'Mostra tutti' },
        { type: 'separator' },
        { role: 'quit', label: 'Esci da DottorTime' }
      ]
    },
    {
      label: 'Modifica',
      submenu: [
        { role: 'undo', label: 'Annulla' },
        { role: 'redo', label: 'Ripeti' },
        { type: 'separator' },
        { role: 'cut', label: 'Taglia' },
        { role: 'copy', label: 'Copia' },
        { role: 'paste', label: 'Incolla' },
        { role: 'selectAll', label: 'Seleziona tutto' }
      ]
    },
    {
      label: 'Finestra',
      submenu: [
        { role: 'minimize', label: 'Riduci a icona' },
        { role: 'zoom', label: 'Zoom' },
        { role: 'front', label: 'Porta tutto in primo piano' }
      ]
    },
    {
      label: 'Aiuto',
      submenu: [
        {
          label: 'Cartella dati',
          click: () => shell.openPath(app.getPath('userData'))
        }
      ]
    }
  ]

  return Menu.buildFromTemplate(template)
}
