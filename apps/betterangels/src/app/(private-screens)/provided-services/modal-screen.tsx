import {
    OtherCategory,
    ServiceEnum,
    ServiceRequestTypeEnum,
    ServicesByCategory,
    useCreateNoteServiceRequestMutation,
    useDeleteServiceRequestMutation,
    useSnackbar
} from '@monorepo/expo/betterangels';
import { FileSearchIcon, SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
    BasicInput,
    Button,
    TextBold,
    TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ServiceCheckbox from 'libs/expo/betterangels/src/lib/ui-components/RequestedProvidedServices/ServiceCheckbox';
import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';

export default function ProvidedServicesModalScreen() {
    const router = useRouter();
    const { noteId, type } = useLocalSearchParams();
    const { showSnackbar } = useSnackbar();

    const [services, setServices] = useState<Array<{
        id: string | undefined;
        enum: ServiceEnum | null;
        markedForDeletion?: boolean;
    }>>([]);

    const [serviceOthers, setServiceOthers] = useState<{
        title: string | null;
        id: string | undefined;
        markedForDeletion?: boolean;
    }[]>([]);

    const [isSubmitLoading, setIsSubmitLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const [deleteService] = useDeleteServiceRequestMutation();
    const [createService] = useCreateNoteServiceRequestMutation();

    const handleFilter = (text: string) => {
        setSearchText(text);
    };

    const filteredServices = ServicesByCategory.map((category) => ({
        ...category,
        items: category.items.filter((item) =>
            item.toLowerCase().includes(searchText.toLowerCase())
        ),
    }));

    const reset = async () => {
        try {
            const deleteServices = services.map((service) => ({
                ...service,
                markedForDeletion: true,
            }));
            const deleteServiceOthers = serviceOthers.map((service) => ({
                ...service,
                markedForDeletion: true,
            }));

            setServices(deleteServices);
            setServiceOthers(deleteServiceOthers);
        } catch (e) {
            console.error(e);
        }
    };

    const submitServices = async () => {
        setIsSubmitLoading(true);
        const toCreateOtherServices = serviceOthers.filter(
            (service) =>
                service.title !== null && !service.id && !service.markedForDeletion
        );
        const toCreateServices = services.filter(
            (service) =>
                service.enum !== null && !service.id && !service.markedForDeletion
        );

        const toRemoveOtherServices = serviceOthers.filter(
            (service) => service.markedForDeletion && !!service.id
        );

        const toRemoveServices = services.filter(
            (service) => service.markedForDeletion && !!service.id
        );

        const toRemoveServicesWithOther = [
            ...toRemoveOtherServices,
            ...toRemoveServices,
        ];

        try {
            for (const service of toRemoveServicesWithOther) {
                if (service.id) {
                    try {
                        await deleteService({
                            variables: {
                                data: {
                                    id: service.id,
                                },
                            },
                        });
                    } catch (error) {
                        console.error(
                            `Error deleting service with id ${service.id}:`,
                            error
                        );
                    }
                }
            }

            for (const service of toCreateServices) {
                if (service.enum) {
                    try {
                        await createService({
                            variables: {
                                data: {
                                    service: service.enum,
                                    noteId: String(noteId),
                                    serviceRequestType: type === 'REQUESTED' ? ServiceRequestTypeEnum.Requested : ServiceRequestTypeEnum.Provided,
                                },
                            },
                        });
                    } catch (error) {
                        console.error(
                            `Error creating service with enum ${service.enum}:`,
                            error
                        );
                    }
                }
            }

            for (const service of toCreateOtherServices) {
                if (service.title) {
                    try {
                        await createService({
                            variables: {
                                data: {
                                    service: ServiceEnum.Other,
                                    serviceOther: service.title,
                                    noteId: String(noteId),
                                    serviceRequestType: type === 'REQUESTED' ? ServiceRequestTypeEnum.Requested : ServiceRequestTypeEnum.Provided,
                                },
                            },
                        });
                    } catch (error) {
                        console.error(
                            `Error creating service with title ${service.title}:`,
                            error
                        );
                    }
                }
            }

            router.back();
        } catch (e) {
            console.error('Error during service submission:', e);
            showSnackbar({
                message: 'Sorry, there was an error updating the services.',
                type: 'error',
            });
        } finally {
            setIsSubmitLoading(false);
        }
    };

    const hasResults = filteredServices.some(
        (category) => category.items.length > 0
    );

    return (
        <>
            <KeyboardAwareScrollView
                style={{ flex: 1, backgroundColor: Colors.WHITE }}
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'flex-start',
                    paddingBottom: Spacings.xl + 80,
                    paddingHorizontal: Spacings.md,
                }}
                keyboardShouldPersistTaps="handled"
                enabled
                extraKeyboardSpace={Platform.OS === 'ios' ? 0 : 100}
            >
                <View>
                    <TextBold size="lg">
                        {type === 'REQUESTED' ? 'Requested Services' : 'Provided Services'}
                    </TextBold>
                    <TextRegular mt="xxs" mb="sm">
                        Select the services to your client in this interaction.
                    </TextRegular>
                </View>
                <BasicInput
                    value={searchText}
                    onDelete={() => setSearchText('')}
                    onChangeText={handleFilter}
                    placeholder="Search a service"
                    icon={<SearchIcon color={Colors.NEUTRAL} />}
                />
                {hasResults ? (
                    filteredServices.map((service) =>
                        service.items.length > 0 ? (
                            <View key={service.title}>
                                <TextBold mb="xs">{service.title}</TextBold>
                                {service.items.map((item, idx) => {
                                    return (
                                        <ServiceCheckbox
                                            key={item}
                                            services={services}
                                            setServices={setServices}
                                            service={item}
                                            idx={idx}
                                        />
                                    );
                                })}
                            </View>
                        ) : null
                    )
                ) : (
                    <View style={{ alignItems: 'center' }}>
                        <View
                            style={{
                                height: 90,
                                width: 90,
                                backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
                                borderRadius: 100,
                                marginBottom: Spacings.md,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <FileSearchIcon size="2xl" />
                        </View>
                        <TextBold mb="xs" size="sm">
                            No Results
                        </TextBold>
                        <TextRegular size="sm">
                            Try searching for something else.
                        </TextRegular>
                    </View>
                )}
                <View>
                    <TextBold>Other</TextBold>
                    <OtherCategory
                        setServices={setServiceOthers}
                        services={serviceOthers}
                    />
                </View>
            </KeyboardAwareScrollView>

            <View
                style={{
                    flexDirection: 'row',
                    gap: Spacings.xs,
                    width: '100%',
                    paddingTop: Spacings.sm,
                    paddingBottom: Spacings.sm,
                    alignItems: 'center',
                    paddingHorizontal: Spacings.md,
                    backgroundColor: Colors.WHITE,
                    shadowColor: Colors.BLACK,
                    shadowOffset: {
                        width: 0,
                        height: -5,
                    },
                    shadowOpacity: 0.05,
                    shadowRadius: 3.84,
                    elevation: 1,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                }}
            >
                <View style={{ flex: 1 }}>
                    <Button
                        onPress={reset}
                        size="full"
                        variant="secondary"
                        title="Reset"
                        accessibilityHint="resets all checkboxes"
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Button
                        disabled={isSubmitLoading}
                        loading={isSubmitLoading}
                        onPress={submitServices}
                        size="full"
                        variant="primary"
                        title="Done"
                        accessibilityHint="closes services modal"
                    />
                </View>
            </View>
            <KeyboardToolbar content={<View />} showArrows={false} />
        </>
    );
}
