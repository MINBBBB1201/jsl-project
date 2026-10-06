"""Isolated tool fixture. This is not an approved JSL production asset."""
import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector

output = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
output.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 8
scene.render.threads_mode = 'FIXED'
scene.render.threads = 2
scene.render.resolution_x = 320
scene.render.resolution_y = 180
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(output / 'render.png')
scene.world = bpy.data.worlds.new('ToolFixtureWorld')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.12, 0.12, 0.12, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35

def box(name, location, scale, color):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    item = bpy.context.object
    item.name = name
    item.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    material = bpy.data.materials.new(name + 'Material')
    material.use_nodes = True
    material.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*color, 1)
    material.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.55
    item.data.materials.append(material)
    return item

box('ToolFixtureContainer', (0, 0, 0.65), (2.4, 1.0, 1.0), (0.92, 0.28, 0.06))
box('ToolFixtureTrailer', (0, 0, 0.1), (2.8, 1.25, 0.1), (0.04, 0.06, 0.1))
box('ToolFixtureGround', (0, 0, -0.025), (8, 8, 0.05), (0.18, 0.2, 0.22))
bpy.ops.object.camera_add(location=(4, -5, 3))
camera = bpy.context.object
camera.rotation_euler = (Vector((0, 0, 0.6)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 4.7
scene.camera = camera
bpy.ops.object.light_add(type='AREA', location=(1, -3, 5))
light = bpy.context.object
light.data.energy = 500
light.data.size = 4
light.rotation_euler = (Vector((0, 0, 0)) - light.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.render.render(write_still=True)
bpy.ops.export_scene.gltf(filepath=str(output / 'fixture.glb'), export_format='GLB', export_animations=False)
(output / 'blender-fixture.json').write_text(json.dumps({
    'version': bpy.app.version_string,
    'render': str(output / 'render.png'),
    'model': str(output / 'fixture.glb'),
    'scope': 'Synthetic tool fixture only; not a production visual or approved motion.'
}, indent=2), encoding='utf-8')
