/**
 * Servicio para generar HTML de fallback cuando la app no está instalada
 * Este HTML permite ver la publicación en el navegador
 */

export interface PublicacionHTMLData {
  publicacionId: string;
  titulo: string;
  descripcion: string;
  autorNombre: string;
  autorFoto?: string;
  fechaPublicacion: string;
  vistas: number;
  likes: number;
  comentarios: number;
  materiaId?: string;
  materiaNombre?: string;
}

/**
 * Genera HTML para mostrar una publicación en el navegador
 */
export const generarHTMLPublicacion = (data: PublicacionHTMLData): string => {
  const appLink = `informatica://publicacion/${data.publicacionId}`;
  const playStoreLink = 'https://play.google.com/store/apps/details?id=com.informatica.app';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.titulo} - Informática App</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 24px 20px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 24px;
            margin-bottom: 8px;
            word-wrap: break-word;
        }
        
        .subject-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            margin-top: 8px;
        }
        
        .author-section {
            display: flex;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .author-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: #667eea;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 20px;
            margin-right: 12px;
            flex-shrink: 0;
            overflow: hidden;
        }
        
        .author-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .author-info {
            flex: 1;
        }
        
        .author-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
        }
        
        .publication-date {
            font-size: 12px;
            color: #999;
        }
        
        .content {
            padding: 20px;
        }
        
        .description {
            color: #555;
            line-height: 1.6;
            margin-bottom: 20px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .stats {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
            flex-wrap: wrap;
        }
        
        .stat-item {
            display: flex;
            align-items: center;
            gap: 6px;
            background: #f5f5f5;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 14px;
            color: #666;
        }
        
        .stat-icon {
            font-size: 16px;
        }
        
        .actions {
            display: flex;
            gap: 12px;
            flex-direction: column;
        }
        
        .btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .btn-secondary {
            background: #f5f5f5;
            color: #333;
            border: 2px solid #667eea;
        }
        
        .btn-secondary:hover {
            background: #efefef;
        }
        
        .download-section {
            background: #f9f9f9;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            text-align: center;
            border: 2px dashed #667eea;
        }
        
        .download-section h3 {
            color: #667eea;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .download-section p {
            color: #666;
            font-size: 12px;
            margin-bottom: 12px;
        }
        
        .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
            color: #999;
            font-size: 12px;
        }
        
        .app-icon {
            width: 32px;
            height: 32px;
            margin: 0 auto 12px;
        }
        
        @media (max-width: 480px) {
            .header h1 {
                font-size: 20px;
            }
            
            .author-section {
                padding: 16px;
            }
            
            .content {
                padding: 16px;
            }
            
            .stats {
                gap: 8px;
            }
            
            .stat-item {
                font-size: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${escapeHtml(data.titulo)}</h1>
            ${data.materiaNombre ? `<div class="subject-badge">${escapeHtml(data.materiaNombre)}</div>` : ''}
        </div>
        
        <div class="author-section">
            <div class="author-avatar">
                ${data.autorFoto ? `<img src="${escapeHtml(data.autorFoto)}" alt="Avatar">` : `${data.autorNombre?.charAt(0).toUpperCase() || '?'}`}
            </div>
            <div class="author-info">
                <div class="author-name">${escapeHtml(data.autorNombre)}</div>
                <div class="publication-date">${data.fechaPublicacion}</div>
            </div>
        </div>
        
        <div class="content">
            <div class="description">${escapeHtml(data.descripcion)}</div>
            
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-icon">👁️</span>
                    <span>${data.vistas} vistas</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">❤️</span>
                    <span>${data.likes} likes</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">💬</span>
                    <span>${data.comentarios} comentarios</span>
                </div>
            </div>
            
            <div class="download-section">
                <h3>📱 ¿Tienes la app instalada?</h3>
                <p>Abre esta publicación directamente en la app para ver todos los archivos y contenido.</p>
                <div class="actions">
                    <a href="${appLink}" class="btn btn-primary">
                        Abrir en la app
                    </a>
                    <a href="${playStoreLink}" class="btn btn-secondary" target="_blank">
                        Descargar app desde Play Store
                    </a>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="app-icon">📚</div>
            <p>Información de la publicación compartida desde Informática App</p>
        </div>
    </div>
    
    <script>
        // Intentar abrir la app automáticamente al cargar
        window.addEventListener('load', () => {
            // Solo intentar abrir en móviles
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                setTimeout(() => {
                    window.location.href = '${appLink}';
                }, 500);
            }
        });
    </script>
</body>
</html>
  `;
};

/**
 * Escapa caracteres especiales HTML para evitar inyección
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Genera una URL base64 que contiene el HTML
 * Útil para pasar como deep link
 */
export const generarDataURLPublicacion = (data: PublicacionHTMLData): string => {
  const html = generarHTMLPublicacion(data);
  const base64 = btoa(unescape(encodeURIComponent(html)));
  return `data:text/html;base64,${base64}`;
};
