Pod::Spec.new do |s|
  s.name = 'CodematicaHandwriting'
  s.version = '1.0.0'
  s.summary = 'Device-local PencilKit notebook ink'
  s.description = 'Captures native ink and bridges completed samples to the shared notebook engine.'
  s.license = { :type => 'MIT' }
  s.author = 'Codematica'
  s.homepage = 'https://github.com/dano/codematica'
  s.platforms = { :ios => '16.0' }
  s.source = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
  s.frameworks = 'PencilKit', 'UIKit'
end
