import * as THREE from 'three'

/**
 * Unlit material for painted cut-outs whose textures are uploaded with
 * `premultiplyAlpha = true`. Blending is premultiplied without Three's shader
 * multiply, so filtered edges don't darken; opacity scales colour and alpha
 * together via `setCutoutOpacity`.
 */
export function createCutoutMaterial(
  map: THREE.Texture,
  opacity = 1
): THREE.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  })
  setCutoutOpacity(material, opacity)
  return material
}

export function setCutoutOpacity(
  material: THREE.MeshBasicMaterial,
  opacity: number
): void {
  material.opacity = opacity
  material.color.setScalar(opacity)
}
