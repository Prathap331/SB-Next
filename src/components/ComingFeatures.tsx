import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Image, Video } from 'lucide-react';

const ComingFeatures = () => {
  return (
    <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br bg-[#E9EBF0]/20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-left max-w-6xl mx-auto mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Coming{' '}
            <br className="sm:hidden" />
            <span className="bg-black text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-3xl md:text-4xl font-semibold">
              Exciting Features
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Get ready for revolutionary AI capabilities that will transform your content creation experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
          {/* AI Generated Images */}
          <Card className="shadow-xl bg-[#1a1a1a] backdrop-blur-sm border-0 flex flex-col justify-center items-center py-6 sm:py-8 md:py-12">
            <CardHeader className="text-center px-4 sm:px-6">
              <CardTitle className="text-2xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl text-white flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
                <Image className="w-12 h-12 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 sm:mr-4" />
                <span className="text-center sm:text-left">AI Generated Images</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pl-4 sm:pl-8 md:pl-12 lg:pl-16 xl:pl-20 pr-4 sm:pr-6">
              <div className="space-y-3">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <Sparkles className="text-white w-4 h-4 sm:w-5 sm:h-5 text-black-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-base sm:text-lg md:text-xl text-white">Custom Scene Generation</h4>
                    <p className="text-white text-sm sm:text-md md:text-base">Generate images that perfectly match your script&apos;s narrative and tone</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <Sparkles className="text-white w-4 h-4 sm:w-5 sm:h-5 text-black-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-base sm:text-lg md:text-xl text-white">Character Visualization</h4>
                    <p className="text-sm sm:text-md md:text-base text-white">Bring your characters to life with AI-generated portraits and scenes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Generated Videos */}
          <Card className="shadow-xl bg-[#1a1a1a] backdrop-blur-sm border-0 flex flex-col justify-center items-center py-6 sm:py-8 md:py-12">
            <CardHeader className="text-center px-4 sm:px-6">
              <CardTitle className="text-2xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl text-white flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
                <Video className="w-12 h-12 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 sm:mr-4" />
                <span className="text-center sm:text-left">AI Generated Videos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pl-4 sm:pl-8 md:pl-12 lg:pl-16 xl:pl-20 pr-4 sm:pr-6">
              <div className="space-y-3">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <Sparkles className="text-white w-4 h-4 sm:w-5 sm:h-5 text-black-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-base sm:text-lg md:text-xl text-white">Custom Scene Generation</h4>
                    <p className="text-white text-sm sm:text-md md:text-base">Generate images that perfectly match your script&apos;s narrative and tone</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <Sparkles className="text-white w-4 h-4 sm:w-5 sm:h-5 text-black-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-base sm:text-lg md:text-xl text-white">Character Visualization</h4>
                    <p className="text-sm sm:text-md md:text-base text-white">Bring your characters to life with AI-generated portraits and scenes</p>
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
