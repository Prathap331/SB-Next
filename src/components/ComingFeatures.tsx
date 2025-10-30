import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Image, Video } from 'lucide-react';

const ComingFeatures = () => {
  return (
    <section className="py-16 bg-gradient-to-br bg-[#E9EBF0]/20">
      <div className="container mx-auto px-4">
        <div className="text-left max-w-6xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Coming{' '}
            <span className="bg-black text-white px-2 py-1 rounded text-3xl md:text-4xl font-semibold">
              Exciting Features
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Get ready for revolutionary AI capabilities that will transform your content creation experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* AI Generated Images */}
          <Card className="shadow-xl bg-[#1a1a1a] backdrop-blur-sm border-0 flex flex-col justify-center items-center py-12">
            <CardHeader className="text-center">
              <CardTitle className="text-6xl text-white flex items-center">
                <Image size={48} className="mr-4" />
                AI Generated Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pl-20">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Sparkles className="text-white w-5 h-5 text-black-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-xl text-white">Custom Scene Generation</h4>
                    <p className="text-white text-md">Generate images that perfectly match your script&apos;s narrative and tone</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Sparkles className="text-white w-5 h-5 text-black-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-xl text-white">Character Visualization</h4>
                    <p className="text-md text-white">Bring your characters to life with AI-generated portraits and scenes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Generated Videos */}
          <Card className="shadow-xl bg-[#1a1a1a] backdrop-blur-sm border-0 flex flex-col justify-center items-center py-12">
            <CardHeader className="text-center">
              <CardTitle className="text-6xl text-white flex items-center">
                <Video size={48} className="mr-4" />
                AI Generated Videos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pl-20">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Sparkles className="text-white w-5 h-5 text-black-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-xl text-white">Custom Scene Generation</h4>
                    <p className="text-white text-md">Generate images that perfectly match your script&apos;s narrative and tone</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Sparkles className="text-white w-5 h-5 text-black-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-xl text-white">Character Visualization</h4>
                    <p className="text-md text-white">Bring your characters to life with AI-generated portraits and scenes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ComingFeatures;
