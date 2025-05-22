import { BaseModalLayout, Button, TextBold, TextRegular } from "@monorepo/expo/shared/ui-components";
import { Image, View } from 'react-native';

export default function ModalDemoScreen() {
    return (
        <BaseModalLayout title="Demo Modal" subtitle="This modal can render anything">
            <TextBold mb="md">You can put JSX here</TextBold>
            <Image
                source={{ uri: 'https://placekitten.com/200/200' }}
                style={{ width: 200, height: 200, borderRadius: 16, marginBottom: 16 }}
            />
            <TextRegular mb="md"> Custom text, images, buttons, etc.</TextRegular>
            <Button
                title="Do Something"
                onPress={() => alert('Button pressed')}
                variant="primary"
                accessibilityHint="Triggers a demo alert"
            />
            <View style={{ height: 40 }} />
            <TextRegular size="sm" color="gray">You can add more components below</TextRegular>
        </BaseModalLayout>
    );
}
