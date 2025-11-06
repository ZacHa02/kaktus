
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CactusConfig } from '../../app.component';

@Component({
  selector: 'app-cactus-viewer',
  template: `<div #container class="w-full h-full cursor-grab active:cursor-grabbing"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CactusViewerComponent implements AfterViewInit, OnDestroy {
  container = viewChild.required<ElementRef<HTMLDivElement>>('container');
  config = input.required<CactusConfig>();

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private cactusGroup!: THREE.Group;
  private animationFrameId: number = 0;
  private resizeObserver!: ResizeObserver;

  private bodyMaterial!: THREE.MeshStandardMaterial;
  private potMaterial!: THREE.MeshStandardMaterial;
  private spineMaterial!: THREE.LineBasicMaterial;
  private flowerMaterials: THREE.MeshStandardMaterial[] = [];

  constructor() {
    effect(() => {
      this.updateCactusMesh(this.config());
    });
  }

  ngAfterViewInit(): void {
    this.initThreeJs();
    this.updateCactusMesh(this.config());
    this.animate();
    this.resizeObserver = new ResizeObserver(() => this.onWindowResize());
    this.resizeObserver.observe(this.container().nativeElement);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    
    this.bodyMaterial.dispose();
    this.potMaterial.dispose();
    this.spineMaterial.dispose();
    this.flowerMaterials.forEach(m => m.dispose());

    this.scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
        }
    });
  }

  private initThreeJs(): void {
    const containerEl = this.container().nativeElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xfafaf9); // stone-50

    this.camera = new THREE.PerspectiveCamera(50, containerEl.clientWidth / containerEl.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 1, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(containerEl.clientWidth, containerEl.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerEl.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 20;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1.0;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);

    this.cactusGroup = new THREE.Group();
    this.scene.add(this.cactusGroup);
    
    this.bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.8 }); // lime-900
    this.potMaterial = new THREE.MeshStandardMaterial({ color: 0xBC6C25, roughness: 0.8 }); // Earthy brown/orange
    this.spineMaterial = new THREE.LineBasicMaterial({ color: 0xFFFBEB }); // yellow-50
    this.flowerMaterials = [
        new THREE.MeshStandardMaterial({ color: 0xE60073, roughness: 0.6 }), // Deep Pink
        new THREE.MeshStandardMaterial({ color: 0x9C27B0, roughness: 0.6 }), // Purple
        new THREE.MeshStandardMaterial({ color: 0xF44336, roughness: 0.6 }), // Red
        new THREE.MeshStandardMaterial({ color: 0xAD1457, roughness: 0.6 }), // Cranberry Red
        new THREE.MeshStandardMaterial({ color: 0xFF4081, roughness: 0.6 }), // Bright Pink
    ];
  }

  private onWindowResize = (): void => {
    const containerEl = this.container()?.nativeElement;
    if (containerEl) {
        this.camera.aspect = containerEl.clientWidth / containerEl.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(containerEl.clientWidth, containerEl.clientHeight);
    }
  }

  private mulberry32(a: number) {
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }

  private generateSpinesForGeometry(geometry: THREE.BufferGeometry, config: CactusConfig, rand: () => number): THREE.LineSegments {
    const baseSpineLength = config.spines.length / 400;
    const spineDensity = config.spines.density / 100;
    const normals = geometry.attributes.normal;
    const positions = geometry.attributes.position;
    const totalVertices = positions.count;
    const spineCount = Math.floor(spineDensity * totalVertices * 50);

    const points = [];
    for (let i = 0; i < spineCount; i++) {
        const index = Math.floor(rand() * totalVertices);
        const start = new THREE.Vector3().fromBufferAttribute(positions, index);
        const normal = new THREE.Vector3().fromBufferAttribute(normals, index);
        
        const lengthVariation = 0.5 + rand();
        const currentSpineLength = baseSpineLength * lengthVariation;

        const angleVariation = 0.4;
        const randomOffset = new THREE.Vector3((rand() - 0.5), (rand() - 0.5), (rand() - 0.5)).multiplyScalar(angleVariation);
        const perturbedNormal = normal.clone().add(randomOffset).normalize();

        const end = start.clone().add(perturbedNormal.multiplyScalar(currentSpineLength));
        points.push(start, end);
    }
    const spineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.LineSegments(spineGeometry, this.spineMaterial);
  }

  private updateCactusMesh(config: CactusConfig): void {
    if (!this.scene) return;

    // Independent Random Number Generators for full stability
    const bodySpineRand = this.mulberry32(99); 
    const flowerRand = this.mulberry32(config.addons.seed); 
    const armPlacementRand = this.mulberry32(config.arms.placementSeed); 
    const armSpineRand = this.mulberry32(199); 

    while (this.cactusGroup.children.length > 0) {
        const child = this.cactusGroup.children[0];
        this.cactusGroup.remove(child);
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments || child instanceof THREE.Group) {
          child.traverse((obj: any) => {
            if (obj.geometry) obj.geometry.dispose();
          });
        }
    }

    const height = config.body.height / 40;
    const width = (config.body.width / 100) * (height / 2.5);
    const ribs = config.body.ribs;
    const segmentation = Math.max(3, Math.round(config.body.segmentation / 5));
    const potSize = config.addons.potSize / 60;

    const potGroup = new THREE.Group();
    const potBodyHeight = potSize * 0.9;
    const potRimHeight = potSize * 0.2;
    const potBodyGeom = new THREE.CylinderGeometry(potSize * 0.9, potSize * 0.7, potBodyHeight, 32);
    const potBody = new THREE.Mesh(potBodyGeom, this.potMaterial);
    potBody.receiveShadow = true;
    potBody.castShadow = true;
    potGroup.add(potBody);

    const potRimGeom = new THREE.CylinderGeometry(potSize, potSize * 0.95, potRimHeight, 32);
    const potRim = new THREE.Mesh(potRimGeom, this.potMaterial);
    potRim.position.y = potBodyHeight / 2 - potRimHeight / 2 + 0.01;
    potRim.receiveShadow = true;
    potRim.castShadow = true;
    potGroup.add(potRim);
    
    potGroup.position.y = -height / 2;
    this.cactusGroup.add(potGroup);

    const bodyGeometry = new THREE.CylinderGeometry(width, width, height, ribs, segmentation, false);
    const posAttr = bodyGeometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
        vertex.fromBufferAttribute(posAttr, i);
        const angle = Math.atan2(vertex.x, vertex.z);
        const ribFactor = 1 - Math.cos(angle * ribs) * 0.1;
        vertex.x *= ribFactor;
        vertex.z *= ribFactor;
        posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    bodyGeometry.computeVertexNormals();

    const cactusBody = new THREE.Mesh(bodyGeometry, this.bodyMaterial);
    cactusBody.position.y = potBodyHeight / 2 - 0.1;
    cactusBody.castShadow = true;
    cactusBody.receiveShadow = true;
    this.cactusGroup.add(cactusBody);

    if (config.spines.density > 0) {
        const spines = this.generateSpinesForGeometry(bodyGeometry, config, bodySpineRand);
        spines.position.copy(cactusBody.position);
        this.cactusGroup.add(spines);
    }

    // Create Arms
    if (config.arms.count > 0) {
      for (let i = 0; i < config.arms.count; i++) {
        const armLength = (config.arms.length / 100) * height * 0.7;
        const armThickness = (config.arms.thickness / 100) * width * 0.8;
        const armPosition = (config.arms.position / 100) * height - height / 2;

        const horizontalPart = armLength * 0.4;
        const verticalPart = armLength * 0.6;

        const armRandAngle = armPlacementRand() * Math.PI * 2;
        
        // Apply the same rib logic to the arm's starting point to ensure it touches the body
        const ribFactor = 1 - Math.cos(armRandAngle * ribs) * 0.1;
        const effectiveRadius = width * ribFactor;
        
        const startX = Math.cos(armRandAngle) * effectiveRadius;
        const startZ = Math.sin(armRandAngle) * effectiveRadius;

        const path = new THREE.CurvePath<THREE.Vector3>();
        const start = new THREE.Vector3(startX, armPosition, startZ);
        const corner = new THREE.Vector3(startX + Math.cos(armRandAngle) * horizontalPart, armPosition, startZ + Math.sin(armRandAngle) * horizontalPart);
        const end = new THREE.Vector3(corner.x, armPosition + verticalPart, corner.z);
        path.add(new THREE.LineCurve3(start, corner));
        path.add(new THREE.LineCurve3(corner, end));

        const armGeometry = new THREE.TubeGeometry(path, Math.max(3, Math.round(config.body.segmentation / 5)), armThickness, ribs, false);
        const armPosAttr = armGeometry.attributes.position;
        const armVertex = new THREE.Vector3();
        for (let j = 0; j < armPosAttr.count; j++) {
            armVertex.fromBufferAttribute(armPosAttr, j);
            const angle = Math.atan2(armVertex.x - startX, armVertex.z - startZ);
            const ribFactor = 1 - Math.cos(angle * ribs) * 0.1;
            armVertex.x = startX + (armVertex.x - startX) * ribFactor;
            armVertex.z = startZ + (armVertex.z - startZ) * ribFactor;
            armPosAttr.setXYZ(j, armVertex.x, armVertex.y, armVertex.z);
        }
        armGeometry.computeVertexNormals();

        const armMesh = new THREE.Mesh(armGeometry, this.bodyMaterial);
        armMesh.castShadow = true;
        armMesh.receiveShadow = true;
        armMesh.position.copy(cactusBody.position);
        this.cactusGroup.add(armMesh);
        
        // Add a sphere at the base to ensure a seamless connection and fill the hole
        const startCapGeometry = new THREE.SphereGeometry(armThickness, ribs, Math.max(4, Math.floor(ribs / 2)));
        const startCapPosAttr = startCapGeometry.attributes.position;
        const startCapVertex = new THREE.Vector3();
        for (let j = 0; j < startCapPosAttr.count; j++) {
            startCapVertex.fromBufferAttribute(startCapPosAttr, j);
            const angle = Math.atan2(startCapVertex.x, startCapVertex.z);
            const ribFactor = 1 - Math.cos(angle * ribs) * 0.1;
            startCapVertex.x *= ribFactor;
            startCapVertex.z *= ribFactor;
            startCapPosAttr.setXYZ(j, startCapVertex.x, startCapVertex.y, startCapVertex.z);
        }
        startCapGeometry.computeVertexNormals();
        const startCapMesh = new THREE.Mesh(startCapGeometry, this.bodyMaterial);
        startCapMesh.position.copy(start).add(cactusBody.position);
        startCapMesh.castShadow = true;
        startCapMesh.receiveShadow = true;
        this.cactusGroup.add(startCapMesh);
        
        const capGeometry = new THREE.SphereGeometry(armThickness, ribs, Math.max(4, Math.floor(ribs / 2)));
        const capPosAttr = capGeometry.attributes.position;
        const capVertex = new THREE.Vector3();
        for (let j = 0; j < capPosAttr.count; j++) {
            capVertex.fromBufferAttribute(capPosAttr, j);
            const angle = Math.atan2(capVertex.x, capVertex.z);
            const ribFactor = 1 - Math.cos(angle * ribs) * 0.1;
            capVertex.x *= ribFactor;
            capVertex.z *= ribFactor;
            capPosAttr.setXYZ(j, capVertex.x, capVertex.y, capVertex.z);
        }
        capGeometry.computeVertexNormals();
        const capMesh = new THREE.Mesh(capGeometry, this.bodyMaterial);
        capMesh.position.copy(end).add(cactusBody.position);
        capMesh.castShadow = true;
        capMesh.receiveShadow = true;
        this.cactusGroup.add(capMesh);

        if (config.spines.density > 0) {
            const armSpines = this.generateSpinesForGeometry(armGeometry, config, armSpineRand);
            armSpines.position.copy(cactusBody.position);
            this.cactusGroup.add(armSpines);
        }
      }
    }

    // Create Flowers
    if (config.addons.flowers > 0) {
        const baseFlowerSize = config.addons.flowerSize / 500;
        const variationFactor = config.addons.flowerSizeVariation / 100;

        for (let i = 0; i < config.addons.flowers; i++) {
            const sizeMultiplier = 1 + (flowerRand() - 0.5) * 2 * variationFactor;
            const finalFlowerSize = baseFlowerSize * sizeMultiplier;
            
            const flowerGeom = new THREE.IcosahedronGeometry(finalFlowerSize, 2);
            const posAttrFlower = flowerGeom.attributes.position;
            const vertexFlower = new THREE.Vector3();
            const noiseFactor = finalFlowerSize * 0.15;

            for (let j = 0; j < posAttrFlower.count; j++) {
                vertexFlower.fromBufferAttribute(posAttrFlower, j);

                const pushFactor = 1.0 + Math.sin(Math.acos(vertexFlower.y / finalFlowerSize)) * 0.5;
                vertexFlower.multiplyScalar(pushFactor);

                vertexFlower.x += (flowerRand() - 0.5) * noiseFactor;
                vertexFlower.y += (flowerRand() - 0.5) * noiseFactor;
                vertexFlower.z += (flowerRand() - 0.5) * noiseFactor;

                posAttrFlower.setXYZ(j, vertexFlower.x, vertexFlower.y, vertexFlower.z);
            }
            flowerGeom.computeVertexNormals();

            const randomMaterial = this.flowerMaterials[Math.floor(flowerRand() * this.flowerMaterials.length)];
            const flower = new THREE.Mesh(flowerGeom, randomMaterial);
            flower.castShadow = true;

            const phi = flowerRand() * Math.PI * 2;
            const yOffset = height / 2 - finalFlowerSize * 1.5 + (flowerRand() - 0.5) * 0.2;
            const radiusAtY = width * (1 - (yOffset - height/2) / height);

            flower.position.x = Math.cos(phi) * radiusAtY * 0.9;
            flower.position.z = Math.sin(phi) * radiusAtY * 0.9;
            flower.position.y = yOffset + cactusBody.position.y;
            
            flower.rotation.x = flowerRand() * Math.PI;
            flower.rotation.y = flowerRand() * Math.PI * 2;
            flower.rotation.z = flowerRand() * Math.PI;

            this.cactusGroup.add(flower);
        }
    }

    const box = new THREE.Box3().setFromObject(this.cactusGroup);
    const center = box.getCenter(new THREE.Vector3());
    this.cactusGroup.position.y -= center.y;
    this.controls.target.copy(center).y = 0;
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
