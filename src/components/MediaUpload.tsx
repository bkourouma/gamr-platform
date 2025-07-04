import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { 
  Upload, 
  Camera, 
  FileText, 
  Image, 
  Video,
  X,
  Download,
  Eye,
  MapPin,
  Calendar,
  FileIcon,
  Trash2
} from 'lucide-react'

interface MediaFile {
  id: string
  file: File
  preview?: string
  type: 'photo' | 'document' | 'video' | 'other'
  description?: string
  location?: {
    latitude: number
    longitude: number
  }
  uploadedAt: Date
}

interface MediaUploadProps {
  onFilesChange?: (files: MediaFile[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  showLocation?: boolean
  questionId?: string
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  onFilesChange,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'application/pdf', 'video/*'],
  showLocation = true,
  questionId
}) => {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const getFileType = (file: File): MediaFile['type'] => {
    if (file.type.startsWith('image/')) return 'photo'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type === 'application/pdf' || file.type.includes('document')) return 'document'
    return 'other'
  }

  const getFileIcon = (type: MediaFile['type']) => {
    switch (type) {
      case 'photo': return Image
      case 'video': return Video
      case 'document': return FileText
      default: return FileIcon
    }
  }

  const getFileColor = (type: MediaFile['type']) => {
    switch (type) {
      case 'photo': return 'from-primary-500 to-primary-600'
      case 'video': return 'from-accent-500 to-accent-600'
      case 'document': return 'from-warning-500 to-warning-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const createPreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        resolve(undefined)
      }
    })
  }

  const getCurrentLocation = (): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      )
    })
  }

  const processFiles = async (fileList: FileList) => {
    setIsUploading(true)
    const newFiles: MediaFile[] = []

    for (let i = 0; i < Math.min(fileList.length, maxFiles - files.length); i++) {
      const file = fileList[i]
      const preview = await createPreview(file)
      const location = showLocation ? await getCurrentLocation() : null

      const mediaFile: MediaFile = {
        id: `${Date.now()}-${i}`,
        file,
        preview,
        type: getFileType(file),
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        } : undefined,
        uploadedAt: new Date()
      }

      newFiles.push(mediaFile)
    }

    const updatedFiles = [...files, ...newFiles]
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles)
    setIsUploading(false)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList) {
      processFiles(fileList)
    }
    // Reset input
    if (event.target) {
      event.target.value = ''
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    
    const fileList = event.dataTransfer.files
    if (fileList) {
      processFiles(fileList)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId)
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles)
  }

  const updateFileDescription = (fileId: string, description: string) => {
    const updatedFiles = files.map(f => 
      f.id === fileId ? { ...f, description } : f
    )
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle size="sm" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Ajouter des fichiers</span>
            <Badge variant="outline" size="sm">
              {files.length}/{maxFiles}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
              ${isDragging 
                ? 'border-primary-400 bg-primary-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${files.length >= maxFiles ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Glissez-déposez vos fichiers ici
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ou cliquez pour sélectionner
                </p>
              </div>

              <div className="flex justify-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={files.length >= maxFiles || isUploading}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Fichiers
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={files.length >= maxFiles || isUploading}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Photo
                </Button>
              </div>

              <p className="text-xs text-gray-400">
                Formats acceptés: Images, PDF, Vidéos • Max {maxFiles} fichiers
              </p>
            </div>

            {isUploading && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">Traitement...</span>
                </div>
              </div>
            )}
          </div>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle size="sm">Fichiers joints ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((mediaFile) => {
                const FileIcon = getFileIcon(mediaFile.type)
                const colorClass = getFileColor(mediaFile.type)
                
                return (
                  <div key={mediaFile.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClass} flex-shrink-0`}>
                      <FileIcon className="w-4 h-4 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {mediaFile.file.name}
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(mediaFile.id)}
                          className="text-danger-600 hover:text-danger-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{formatFileSize(mediaFile.file.size)}</span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{mediaFile.uploadedAt.toLocaleTimeString()}</span>
                        </span>
                        {mediaFile.location && (
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>Géolocalisé</span>
                          </span>
                        )}
                      </div>

                      {/* Preview for images */}
                      {mediaFile.preview && (
                        <div className="mt-2">
                          <img
                            src={mediaFile.preview}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}

                      {/* Description input */}
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Ajouter une description..."
                          value={mediaFile.description || ''}
                          onChange={(e) => updateFileDescription(mediaFile.id, e.target.value)}
                          className="w-full px-3 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
