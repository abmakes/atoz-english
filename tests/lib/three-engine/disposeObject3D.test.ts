import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { disposeObject3D } from '@/lib/three-engine/ThreeWorld'

describe('disposeObject3D', () => {
  it('disposes mesh resources and clears children without a WebGL renderer', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const map = new THREE.Texture()
    const material = new THREE.MeshBasicMaterial({ map })
    const mesh = new THREE.Mesh(geometry, material)
    const group = new THREE.Group()
    group.add(mesh)

    const geometryDispose = vi.spyOn(geometry, 'dispose')
    const materialDispose = vi.spyOn(material, 'dispose')
    const textureDispose = vi.spyOn(map, 'dispose')

    disposeObject3D(group)

    expect(group.children).toHaveLength(0)
    expect(geometryDispose).toHaveBeenCalledOnce()
    expect(materialDispose).toHaveBeenCalledOnce()
    expect(textureDispose).toHaveBeenCalledOnce()
  })
})
